from flask import Flask, render_template, session, redirect, url_for, request, flash, jsonify
from database import get_db, ensure_user_indexes
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, template_folder="pages", static_folder="static")
app.secret_key = "secret-key"  # 세션 관리용

@app.before_first_request
def bootstrap():
    ensure_user_indexes()  # userId unique index 보장

# 메인 페이지
@app.route("/")
def home():
    user = session.get("user")  
    return render_template("index.html", user=user)

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

    app.logger.info(f"[LOGIN] email(normalized)={email}") ## check

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
    app.logger.info(f"[LOGIN] user_found={bool(user)}") # check


#check
    ok = check_password_hash(user.get("password_hash", ""), password)
    app.logger.info(f"[LOGIN] password_ok={ok}")

    if not user or not check_password_hash(user.get("password_hash", ""), password):
        print(email)
        return jsonify({
            "isSuccess": False,
            "code": "AUTH401",
            "message": "아이디 또는 비밀번호가 올바르지 않습니다."
        }), 401
###check 


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


@app.route("/mypage")
def mypage():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("mypage.html", user=session.get("user"))
