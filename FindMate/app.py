from flask import Flask, render_template, session, redirect, url_for, request
from database import get_db

app = Flask(__name__)
app.secret_key = "secret-key"  # 세션 관리용

# 메인 페이지
@app.route("/")
def home():
    return render_template("index.html")

# 로그인 페이지
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        session["user"] = username or "게스트"
        return redirect(url_for("home"))
    return render_template("login.html")

# 회원가입 페이지
@app.route("/sign", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        # 여기서 DB 저장 로직 추가 가능
        return redirect(url_for("login"))
    return render_template("sign.html")

# 로그아웃
@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("home"))

if __name__ == "__main__":
    app.run(debug=True)
