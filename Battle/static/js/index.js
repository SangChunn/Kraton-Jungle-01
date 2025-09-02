// ====== 데이터(아직 연동 전) ======
const studies = Array.from({ length: 9 }).map((_, i) => ({
  badge: "모집중",
  category: "EX",
  title: `스터디 예시 ${i + 1}`,
  desc: "React/알고리즘/디자인 등 스터디 설명이 들어갑니다.",
  date: "날짜",
  host: "hihi",
  capacity: "2/4",
}));

// 페이지당 카드 수 (지금 요구대로 2장: 1개 실제 + 1개 빈칸)
const PAGE_SIZE = 6;

// ====== 렌더링 ======
let currentPage = 1;

function render() {
  renderCards();
  renderPagination();
}

function renderCards() {
  const wrap = document.getElementById("cards");
  wrap.innerHTML = "";

  // 페이징된 실제 데이터
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = studies.slice(start, start + PAGE_SIZE);

  // 카드 HTML 생성 (실제)
  pageItems.forEach((item) => wrap.appendChild(cardEl(item)));

  // 부족한 수만큼 플레이스홀더로 채우기
  const placeholders = PAGE_SIZE - pageItems.length;
  for (let i = 0; i < placeholders; i++) {
    wrap.appendChild(placeholderEl());
  }
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(studies.length / PAGE_SIZE));
  const p = document.getElementById("pagination");
  p.innerHTML = "";

  const prev = btn(
    "이전",
    () => changePage(currentPage - 1),
    currentPage === 1
  );
  p.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    const b = document.createElement("button");
    b.className =
      "w-10 h-10 px-3 rounded-lg border text-sm " +
      (isActive
        ? "bg-[var(--brand)] text-white border-transparent"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100");
    b.textContent = i;
    b.onclick = () => changePage(i);
    p.appendChild(b);
  }

  const next = btn(
    "다음",
    () => changePage(currentPage + 1),
    currentPage === totalPages
  );
  p.appendChild(next);
}

function changePage(n) {
  const totalPages = Math.max(1, Math.ceil(studies.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, n), totalPages);
  render();
}

// ====== 컴포넌트들 ======
function btn(label, onClick, disabled = false) {
  const b = document.createElement("button");
  b.textContent = label;
  b.className =
    "h-10 px-4 rounded-lg border text-sm " +
    (disabled
      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100");
  b.disabled = disabled;
  b.onclick = () => !disabled && onClick();
  return b;
}

function cardEl(item) {
  const el = document.createElement("article");
  el.className =
    "h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col";

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">${item.badge}</span>
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">${item.category}</span>
      </div>
      <span class="text-sm text-gray-500">👥 ${item.capacity}</span>
    </div>

    <h3 class="mt-4 text-lg font-extrabold text-gray-800 clamp-2 wrap-anywhere">
      ${item.title}
    </h3>

    <p class="pt-10 text-sm leading-8 text-gray-500 clamp-2 wrap-anywhere">
      ${item.desc}
    </p>

    <div class="mt-auto pt-4 flex items-center gap-3 text-sm text-gray-600">
      <span>👤 ${item.host}</span>
      <span>📅 ${item.date}</span>
    </div>
  `;
  return el;
}

function placeholderEl() {
  const el = document.createElement("article");
  el.className =
    "bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex items-center justify-center min-h-[168px]";
  el.innerHTML = `
        <div class="text-center">
          <p class="text-gray-400 text-sm">아직 스터디가 없어요</p>
        </div>
      `;
  return el;
}

render();
