from flask import Flask, render_template, session, redirect, url_for, request, flash, jsonify
from database import get_db, ensure_user_indexes, ensure_category_indexes,ensure_study_indexes
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import ASCENDING
from datetime import datetime, timedelta
import re
from bson import ObjectId

app = Flask(__name__, template_folder="pages", static_folder="static")
app.secret_key = "secret-key"  # 세션 관리용

from database import get_db
db = get_db()

# applicants가 없거나 배열이 아닌 문서 → 배열로 초기화
db["studies"].update_many(
    {"$or": [
        {"applicants": {"$exists": False}},
        {"applicants": {"$type": "int"}},
        {"applicants": {"$type": "string"}},
    ]},
    {"$set": {"applicants": []}}
)

def serialize_study_small(doc):
    def fmt(dt):
        return dt.strftime("%Y-%m-%d %H:%M") if isinstance(dt, datetime) else ""
    return {
        "id": str(doc.get("_id")),
        "title": doc.get("title", ""),
        "category": doc.get("category", ""),          # key
        "active": doc.get("active", True),
        "startText": fmt(doc.get("start_at") or doc.get("created_at")),
        "capacity": int(doc.get("capacity", 0)),
        "applicants_count": len(doc.get("applicants") or []),
        "host": doc.get("host", ""),
    }

# app.py
from datetime import datetime
from flask import redirect, url_for, render_template, session
from pymongo import ASCENDING, DESCENDING

def _fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M") if isinstance(dt, datetime) else ""

def _serialize_study_small(doc):
    start = doc.get("start_at") or doc.get("created_at")
    return {
        "id": str(doc.get("_id")),
        "title": doc.get("title", ""),
        "category": doc.get("category", ""),         # key
        "active": doc.get("active", True),
        "startText": _fmt(start),
        "capacity": int(doc.get("capacity", 0)),
        "applicants_count": len(doc.get("applicants") or []),
        "host": doc.get("host", ""),
    }

@app.route("/mypage", methods=["GET"])
def mypage():
    if "user" not in session:
        return redirect(url_for("login"))
    uid = (session["user"]["userId"] or "").lower()

    db = get_db()
    profile = db["users"].find_one({"userId": uid}, {"_id": 0, "userId": 1, "name": 1})

    # 주최
    hosted_raw = list(db["studies"].find({"hostId": uid}).sort("created_at", DESCENDING))
    # 신청
    applied_raw = list(db["studies"].find({"applicants.userId": uid}).sort("created_at", DESCENDING))

    hosted = [_serialize_study_small(d) for d in hosted_raw]
    attended = [_serialize_study_small(d) for d in applied_raw]

    cats = list(db["categories"].find({"active": True}, {"_id": 0, "key": 1, "name": 1}).sort("order", ASCENDING))
    cat_map = {c["key"]: c["name"] for c in cats}

    # 로그로 개수 확인 (디버그용)
    app.logger.info(f"/mypage uid={uid} hosted={len(hosted)} applied={len(attended)}")

    return render_template(
        "mypage.html",
        user=session["user"],
        profile=profile,
        hosted_studies=hosted,      
        attended_studies=attended,  
        cat_map=cat_map,
    )
    
    
# @app.before_first_request
# def bootstrap():
#     ensure_user_indexes()
#     ensure_category_indexes()   
#     ensure_study_indexes()   
    
    
# ---- 유틸: 스터디 로드 ----
def _get_study_or_404(study_id):
    db = get_db()
    try:
        oid = ObjectId(study_id)
    except Exception:
        return None
    return db["studies"].find_one({"_id": oid})

# ---- 상세 페이지 ----
@app.route("/study/<study_id>", methods=["GET"], endpoint="study_detail")
def study_detail(study_id):
    db = get_db()
    doc = _get_study_or_404(study_id)
    if not doc:
        flash("존재하지 않는 스터디입니다.", "error")
        return redirect(url_for("home"))

    user = session.get("user")
    is_host = bool(user) and user.get("userId") == doc.get("hostId")
    applicants = doc.get("applicants") or []   # [{userId, name, applied_at}]
    applicants_count = len(applicants)
    capacity = int(doc.get("capacity", 0))
    is_full = capacity > 0 and applicants_count >= capacity
    already_applied = bool(user) and any(a.get("userId") == user.get("userId") for a in applicants)

    # 카테고리 이름 매핑 위해 categories도 같이 전달(선택)
    cats = list(db["categories"].find({"active": True}, {"_id": 0, "key": 1, "name": 1}).sort("order", 1))
    cat_map = {c["key"]: c["name"] for c in cats}
    category_name = cat_map.get(doc.get("category"), doc.get("category"))

    return render_template(
        "apply.html",
        user=user,
        study=doc,
        category_name=category_name,
        is_host=is_host,
        is_full=is_full,
        already_applied=already_applied,
        applicants_count=applicants_count,
        capacity=capacity,
    )

# ---- 신청 API ----
@app.route("/api/studies/<study_id>/apply", methods=["POST"])
def api_study_apply(study_id):
    if "user" not in session:
        return jsonify({"isSuccess": False, "code": "AUTH401", "message": "로그인이 필요합니다."}), 401

    db = get_db()
    doc = _get_study_or_404(study_id)
    if not doc:
        return jsonify({"isSuccess": False, "code": "NOT_FOUND", "message": "존재하지 않는 스터디"}), 404

    user = session["user"]
    if user["userId"] == doc.get("hostId"):
        return jsonify({"isSuccess": False, "code": "IS_HOST", "message": "주최자는 신청할 수 없습니다."}), 400

    if not doc.get("active", True):
        return jsonify({"isSuccess": False, "code": "CLOSED", "message": "이미 모집이 마감되었습니다."}), 400

    applicants = doc.get("applicants") or []
    if any(a.get("userId") == user["userId"] for a in applicants):
        return jsonify({"isSuccess": False, "code": "DUP", "message": "이미 신청하셨습니다."}), 409

    capacity = int(doc.get("capacity", 0))
    applicants_count = len(applicants)
    if capacity > 0 and applicants_count >= capacity:
        return jsonify({"isSuccess": False, "code": "FULL", "message": "정원이 가득 찼습니다."}), 400

    # 등록
    apply_doc = {"userId": user["userId"], "name": user.get("name", ""), "applied_at": datetime.utcnow()}
    updated = db["studies"].find_one_and_update(
        {"_id": doc["_id"], "active": True},
        {
            "$addToSet": {"applicants": apply_doc}
        },
        return_document=True
    )

    # 정원 도달 시 자동 마감(선택)
    if updated:
        applicants = updated.get("applicants") or []
        if capacity > 0 and len(applicants) >= capacity:
            db["studies"].update_one({"_id": updated["_id"]}, {"$set": {"active": False}})

    return jsonify({"isSuccess": True, "code": "COMMON200", "message": "신청 완료"}), 200

# ---- 주최자: 모집 완료 처리 ----
@app.route("/api/studies/<study_id>/close", methods=["POST"])
def api_study_close(study_id):
    if "user" not in session:
        return jsonify({"isSuccess": False, "code": "AUTH401", "message": "로그인이 필요합니다."}), 401

    db = get_db()
    doc = _get_study_or_404(study_id)
    if not doc:
        return jsonify({"isSuccess": False, "code": "NOT_FOUND", "message": "존재하지 않는 스터디"}), 404

    if session["user"]["userId"] != doc.get("hostId"):
        return jsonify({"isSuccess": False, "code": "FORBIDDEN", "message": "주최자만 마감할 수 있습니다."}), 403

    if not doc.get("active", True):
        return jsonify({"isSuccess": False, "code": "ALREADY", "message": "이미 마감되었습니다."}), 400

    db["studies"].update_one({"_id": doc["_id"]}, {"$set": {"active": False}})
    return jsonify({"isSuccess": True, "code": "COMMON200", "message": "모집이 마감되었습니다."}), 200

def parse_korean_timespan(raw: str):
    if not raw:
        return None, None, None
    m = re.match(r"\s*(\d+)월\s*(\d+)일\s*(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})\s*", raw)
    if not m:
        return None, None, None
    mon, day, sh, sm, eh, em = map(int, m.groups())
    year = datetime.now().year
    start = datetime(year, mon, day, sh, sm)
    end = datetime(year, mon, day, eh if eh < 24 else eh - 24, em)
    if eh >= 24:
        end += timedelta(days=1)
    duration_min = int((end - start).total_seconds() // 60) if end > start else None
    return start, end, duration_min

# Mongo -> SSR payload 직렬화 ----
def serialize_study(doc):
    def iso(dt):
        return dt.isoformat() if isinstance(dt, datetime) else ""
    return {
        "id": str(doc.get("_id")),
        "title": doc.get("title", ""),
        "desc": doc.get("content", ""),
        "category": doc.get("category", ""),   # key로 저장
        "host": doc.get("host", ""),
        "capacity": doc.get("capacity", 0),
        "badge": "모집중" if doc.get("active", True) else "마감",
        "dateISO": iso(doc.get("start_at") or doc.get("created_at")),
        "durationMin": doc.get("duration_min", ""),
    }


@app.route("/create", methods=["GET", "POST"])
def create():
    if "user" not in session:
        return redirect(url_for("login"))

    db = get_db()
    cats = list(db["categories"].find({"active": True}, {"_id": 0, "key": 1, "name": 1}).sort("order", 1))

    if request.method == "GET":
        return render_template("create.html", user=session.get("user"), categories=cats)

    # --- POST 수신 필드 (폼과 1:1) ---
    title = (request.form.get("title") or "").strip()
    content = (request.form.get("content") or "").strip()
    category = (request.form.get("category") or "").strip().lower()
    capacity = int(request.form.get("capacity") or 0)
    date_iso = (request.form.get("dateISO") or "").strip()          # "YYYY-MM-DDTHH:MM"
    duration_min = int(request.form.get("durationMin") or 0)

    # --- 검증 ---
    if not title or not category or capacity <= 0:
        flash("제목/카테고리/모집인원은 필수입니다.", "error")
        return render_template("create.html", user=session.get("user"), categories=cats)

    if not db["categories"].find_one({"key": category, "active": True}):
        flash("유효하지 않은 카테고리입니다.", "error")
        return render_template("create.html", user=session.get("user"), categories=cats)

    start_at = None
    end_at = None
    if date_iso:
        try:
            # "YYYY-MM-DDTHH:MM" → Python datetime (naive)
            start_at = datetime.fromisoformat(date_iso)
        except ValueError:
            flash("날짜/시간 형식이 올바르지 않습니다.", "error")
            return render_template("create.html", user=session.get("user"), categories=cats)
    if start_at and duration_min > 0:
        end_at = start_at + timedelta(minutes=duration_min)

    # --- 문서 저장 ---
    doc = {
        "title": title,
        "content": content,
        "category": category,                       # key 저장
        "host": session["user"].get("name", ""),
        "hostId": session["user"]["userId"],
        "capacity": capacity,
        "applicants": [],                           # 배열로 저장 (중요)
        "active": True,                             # 기본 모집중
        "created_at": datetime.utcnow(),
    }
    if start_at:         doc["start_at"] = start_at
    if end_at:           doc["end_at"] = end_at
    if duration_min > 0: doc["duration_min"] = duration_min

    db["studies"].insert_one(doc)
    flash("스터디가 등록되었습니다.", "success")
    return redirect(url_for("home"))



# 메인 페이지
@app.route("/")
def home():
    user = session.get("user")
    db = get_db()
    
    cats = list(
        db["categories"]
        .find({"active": True}, {"_id": 0, "key": 1, "name": 1})
        .sort("order", ASCENDING)
    )
    
    # 최신순 기본(생성일 내림차순)
    raw = list(
        db["studies"].find({"active": True}).sort("created_at", -1)
    )
    studies = [serialize_study(d) for d in raw]

    return render_template(
        "index.html",
        user=user,
        categories=cats,   
        studies=studies,
        sort_order="latest",
    )

@app.route("/api/categories", methods=["GET"])
def api_categories():
    db = get_db()
    cats = list(db["categories"].find({"active": True}, {"_id": 0, "key": 1, "name": 1}).sort("order", 1))
    return jsonify({"isSuccess": True, "code": "COMMON200", "result": cats}), 200


# 로그인 페이지
@app.route("/login", methods=["GET"], endpoint="login")
def login_page():
    return render_template("login.html", user=session.get("user"))

# API: 로그인 
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({
            "isSuccess": False,
            "code": "VALIDATION_ERROR",
            "message": "아이디/비밀번호를 입력해주세요."
        }), 400

    db = get_db()
    db["users"].update_one(
    {"userId": "test"},  # 소문자 기준
    {"$set": {"password_hash": generate_password_hash("Test1234!")}}
)
    user = db["users"].find_one({"userId": email})

    # 로그인 성공 -> 세션에 저장(쿠키는 Flask가 설정)
    session["user"] = {"userId": user["userId"], "name": user.get("name", "")}

    return jsonify({
        "isSuccess": True,
        "code": "COMMON200",
        "message": "로그인 성공"
    }), 200

@app.route("/api/refresh-token", methods=["POST"])
def api_refresh_token():
    if "user" in session:
        return jsonify({"isSuccess": True, "code": "COMMON200", "message": "세션 유효"}), 200
    return jsonify({"isSuccess": False, "code": "AUTH401", "message": "로그인이 필요합니다."}), 401


# 회원가입 페이지
@app.route("/sign", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        user_id = request.form.get("userId", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirmPassword", "")

        if not name or not user_id or not password:
            flash("모든 필드를 입력하세요.", "error")
            return render_template("sign.html", user=session.get("user"))

        if password != confirm_password:
            flash("비밀번호가 일치하지 않습니다.", "error")
            return render_template("sign.html", user=session.get("user"))

        db = get_db()

        # userId 중복 검사
        if db["users"].find_one({"userId": user_id}):
            flash("이미 존재하는 아이디입니다.", "error")
            return render_template("sign.html", user=session.get("user"))

        # 유저 저장
        db["users"].insert_one({
            "name": name,
            "userId": user_id,
            "password_hash": generate_password_hash(password),
        })

        flash("회원가입 완료! 로그인해주세요.", "success")
        return render_template("login.html", user=session.get("user"))
    return render_template("sign.html", user=session.get("user"))

@app.route("/api/join", methods=["POST"])
def api_join():
    data = request.get_json()
    nickname = data.get("nickname", "").strip()
    user_id = data.get("email", "").strip().lower()  # email → 아이디(ID)로 사용됨
    password = data.get("password", "")

    if not nickname or not user_id or not password:
        return jsonify({
            "isSuccess": False,
            "code": "VALIDATION_ERROR",
            "message": "모든 항목을 입력해주세요.",
        }), 400

    db = get_db()

    if db["users"].find_one({"userId": user_id}):
        return jsonify({
            "isSuccess": False,
            "code": "DUPLICATE_ID",
            "message": "이미 존재하는 아이디입니다.",
            "result": True
        }), 409

    db["users"].insert_one({
        "name": nickname,
        "userId": user_id,
        "password_hash": generate_password_hash(password),
    })

    return jsonify({
        "isSuccess": True,
        "code": "COMMON200",
        "message": "회원가입 성공",
        "result": False
    }), 200
    
@app.route("/api/email-check/<email>")
def api_email_check(email):
    db = get_db()
    
    exists = db["users"].find_one({"userId": email.lower()}) is not None
    return jsonify({
        "isSuccess": True,
        "code": "COMMON200",
        "result": exists
    }), 200


# 로그아웃
@app.route("/logout")
def logout():
    session.pop("user", None)
    flash("로그아웃 되었습니다.", "success")
    return redirect(url_for("home"))

if __name__ == "__main__":
    app.run(debug=True)

