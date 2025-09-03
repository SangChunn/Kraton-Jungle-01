// static/js/signup.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationForm");
  if (!form) return;

  // Jinja2에서 주입한 경로들
  const JOIN_URL = form.dataset.joinUrl; // {{ url_for('api_join') }}
  const EMAIL_CHECK_TEMPLATE = form.dataset.emailCheckUrlTemplate; // {{ url_for('api_email_check', email='__EMAIL__') }}
  const LOGIN_URL = form.dataset.loginUrl; // {{ url_for('login') }}

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    validateForm(JOIN_URL, EMAIL_CHECK_TEMPLATE, LOGIN_URL);
  });
});

async function validateForm(JOIN_URL, EMAIL_CHECK_TEMPLATE, LOGIN_URL) {
  const nickname = document.getElementById("nickname").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  resetErrors();

  let isValid = true;

  // username 단순 중복 텍스트 체크

  if (!nickname) {
    setError("nicknameError", "이름을 입력해주세요.");
    isValid = false;
  }

  // 아이디 공백 검사
  if (!username) {
    setError("usernameError", "아이디를 입력해주세요.");
    isValid = false;
  }
  if (!password) {
    setError("passwordError", "비밀번호를 입력해주세요.");
    isValid = false;
  }

  // 비밀번호 확인 공백 검사
  if (!confirmPassword) {
    setError("confirmPasswordError", "비밀번호 확인을 입력해주세요.");
    isValid = false;
  }
  // Validate password
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    document.getElementById("passwordError").textContent =
      "비밀번호는 대소문자, 특수기호를 포함한 8자리 이상이어야 합니다.";
    isValid = false;
  }

  if (password !== confirmPassword) {
    document.getElementById("confirmPasswordError").textContent =
      "비밀번호가 일치하지 않습니다.";
    isValid = false;
  }

  if (!isValid) return;

  try {
    // 아이디(이메일) 중복 검사
    const isUnique = await checkEmail(username, EMAIL_CHECK_TEMPLATE);
    if (!isUnique) {
      setError("usernameError", "이미 등록된 아이디입니다.");
      return;
    }

    // 회원가입 API 호출
    const res = await fetch(JOIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: username,
        password: password,
        nickname: nickname,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.isSuccess) {
      throw new Error(data.message || "회원가입 실패");
    }

    // 성공 시 로그인 페이지로 이동
    window.location.href = LOGIN_URL;
  } catch (error) {
    console.error("회원가입 처리 중 오류:", error);
    alert(error.message || "회원가입 중 오류가 발생했습니다.");
  }
}

// 이메일(아이디) 중복 체크: "__EMAIL__" 자리에 실제 이메일 치환
function checkEmail(email, template) {
  const url = template.replace("__EMAIL__", encodeURIComponent(email));
  return fetch(url, { method: "GET" })
    .then((response) => {
      if (!response.ok) throw new Error("네트워크 응답에 문제가 있습니다.");
      return response.json();
    })
    .then((data) => {
      // data.result === true  -> 이미 존재
      // data.result === false -> 사용 가능
      if (data.isSuccess && data.code === "COMMON200") {
        return !data.result; // 사용 가능이면 true
      }
      throw new Error(data.message || "Unknown error occurred");
    });
}

// 유틸
function resetErrors() {
  [
    "nicknameError",
    "usernameError",
    "passwordError",
    "confirmPasswordError",
  ].forEach((id) => (document.getElementById(id).textContent = ""));
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}
