from flask import Flask, render_template, session, redirect, url_for, request, jsonify, flash
from database import get_db, ensure_user_indexes
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, template_folder="pages")

app.secret_key = "secret-key"  # 세션 관리용

@app.before_first_request
def bootstrap():
    # users.userId unique 인덱스 보장
    ensure_user_indexes()

# 메인 페이지
@app.route("/")
def home():
    user = session.get("user")  # {"userId": ..., "name": ...}
    return render_template("index.html", user=user)

# Atlas 연결 확인
@app.get("/health")
def health():
    db = get_db()
    db.command("ping")
    return {"status": "ok"}


# 로그인 페이지
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user_id = request.form.get("userId", "").strip()
        password = request.form.get("password", "")
        db = get_db()
        user = db["users"].find_one({"userId": user_id})
        if not user or not check_password_hash(user.get("password_hash", ""), password):
            flash("아이디 또는 비밀번호가 올바르지 않습니다.", "error")
            return redirect(url_for("login"))
        session["user"] = {"userId": user["userId"], "name": user.get("name", "")}
        return redirect(url_for("home"))
    return render_template("login.html")

# 회원가입 페이지
@app.route("/sign", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        user_id = request.form.get("userId", "").strip()
        password = request.form.get("password", "")

        if not name or not user_id or not password:
            flash("모든 필드를 입력하세요.", "error")
            return redirect(url_for("signup"))

        db = get_db()
        # userId 중복 검사
        if db["users"].find_one({"userId": user_id}):
            flash("이미 존재하는 아이디입니다.", "error")
            return redirect(url_for("signup"))

        db["users"].insert_one({
            "name": name,
            "userId": user_id,
            "password_hash": generate_password_hash(password),
        })
        flash("회원가입 완료! 로그인해주세요.", "success")
        return redirect(url_for("login"))
    return render_template("sign.html")

# 로그아웃
@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("home"))

if __name__ == "__main__":
    app.run(debug=True)
