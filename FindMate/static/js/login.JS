async function validateForm(event) {
  event.preventDefault();

  const form = document.getElementById("registrationForm");
  const LOGIN_URL = form.dataset.loginUrl; // {{ url_for('api_login') }}
  const REDIRECT_URL = form.dataset.redirectUrl; // {{ url_for('home') }}
  const id = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const caution = document.querySelector(".caution");

  if (id.length < 4 || password.length < 4) {
    caution.textContent = "아이디/비밀번호를 확인해주세요.";
    caution.style.visibility = "visible";
    console.log("caution:", caution.textContent);
    return false;
  }

  caution.style.visibility = "hidden";

  try {
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      credentials: "include", // 서버가 Set-Cookie(HttpOnly)로 JWT 설정
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: id, password }),
    });
    let data = {};
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok || data.isSuccess === false) {
      const msg = (data && (data.message || data.error)) || "로그인 실패";
      throw new Error(msg);
    }

    // ✅ 성공: 토큰은 쿠키에 이미 설정됨(프론트에서 만지지 않음)
    window.location.href = REDIRECT_URL;
    return true;
  } catch (err) {
    console.error("로그인 요청 중 오류:", err);
    caution.textContent = err.message || "서버 오류";
    caution.style.visibility = "visible";
    return false;
  }
}

// 선택: 페이지 들어올 때 리프레시 토큰으로 액세스 재발급 시도
async function refreshToken() {
  const form = document.getElementById("registrationForm");
  if (!form) return;
  const REFRESH_URL = form.dataset.refreshUrl; // {{ url_for('api_refresh_token') }}
  if (!REFRESH_URL) return;

  try {
    const res = await fetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    // 실패해도 치명적 아님
    if (!res.ok) {
      let data = {};
      try {
        data = await res.json();
      } catch (_) {}
      console.warn("토큰 갱신 실패:", data.message || data.error || res.status);
      return;
    }
    console.log("액세스 토큰 갱신 성공");
  } catch (err) {
    console.error("리프레시 토큰 요청 중 오류:", err);
  }
}

document.addEventListener("DOMContentLoaded", refreshToken);
