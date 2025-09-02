async function validateForm(event) {
  event.preventDefault();

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
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      credentials: "include", // ✅ 서버가 Set-Cookie(HttpOnly)로 토큰 설정
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: id,
        password: password,
      }),
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
    window.location.href = "/FindMate/pages/index.html";
    return true;
  } catch (err) {
    console.error("로그인 요청 중 오류:", err);
    caution.textContent = err.message || "서버 오류";
    caution.style.visibility = "visible";
    return false;
  }
}

async function refreshToken() {
  try {
    // ✅ 리프레시 토큰도 HttpOnly 쿠키라고 가정
    const res = await fetch("/api/v1/auth/refresh-token", {
      method: "POST",
      credentials: "include", // 쿠키 자동 전송
      headers: {
        Accept: "application/json",
      },
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok) {
      console.warn("토큰 갱신 실패:", data && (data.message || data.error));
      return;
    }

    console.log("액세스 토큰 갱신 성공");
  } catch (err) {
    console.error("리프레시 토큰 요청 중 오류:", err);
  }
}
document.addEventListener("DOMContentLoaded", refreshToken);
