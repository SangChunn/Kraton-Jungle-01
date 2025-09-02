document
  .getElementById("registrationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    validateForm();
  });

async function validateForm() {
  const nickname = document.getElementById("nickname").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Reset errors
  document.getElementById("nicknameError").textContent = "";
  document.getElementById("usernameError").textContent = "";
  document.getElementById("passwordError").textContent = "";
  document.getElementById("confirmPasswordError").textContent = "";

  let isValid = true;

  // username 단순 중복 텍스트 체크
  if (username === "test") {
    document.getElementById("usernameError").textContent =
      "이미 등록된 아이디입니다.";
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
    // 아이디 중복 검사
    const isUnique = await checkEmailUniqueness(username);
    console.log("Is email unique:", isUnique);
    if (!isUnique) {
      document.getElementById("usernameError").textContent =
        "이미 등록된 아이디입니다.";
      return;
    }

    // 회원가입 API 호출 (서버가 DB에 저장)
    const res = await fetch("/api/v1/auth/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: username,
        password: password,
        nickname: nickname,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.isSuccess) {
      throw new Error(data.message || "회원가입 실패");
    }

    // 성공 시 로그인 페이지로 이동
    window.location.href = "/FindMate/pages/login.html";
  } catch (error) {
    console.error("회원가입 처리 중 오류:", error);
    alert(error.message || "회원가입 중 오류가 발생했습니다.");
  }
}

function checkEmailUniqueness(email) {
  return fetch(`/api/v1/auth/join/email-check/${encodeURIComponent(email)}`, {
    method: "GET",
  })
    .then((response) => {
      console.log("API Response Status:", response.status);
      if (!response.ok) {
        throw new Error("네트워크 응답에 문제가 있습니다.");
      }
      return response.json();
    })
    .then((data) => {
      console.log("API Response:", data);
      if (data.isSuccess && data.code === "COMMON200") {
        // data.result가 true = 이미 존재, false = 사용 가능 이라고 가정
        return !data.result; // 사용 가능이면 true 반환
      } else {
        throw new Error(data.message || "Unknown error occurred");
      }
    });
}
