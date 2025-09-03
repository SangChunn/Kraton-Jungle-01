/*const CS_CATEGORIES = [
  "자료구조/알고리즘",
  "운영체제",
  "네트워크",
  "데이터베이스",
  "컴퓨터구조",
  "보안",
  "웹/프론트엔드",
  "백엔드",
  "클라우드/DevOps",
  "코딩테스트",
];

// 데모 데이터 (초기 화면에 보이도록 모두 badge: '모집중')
const studies = [
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },

  {
    badge: "모집중",
    category: "운영체제",
    title: "OS Concepts 읽기",
    desc: "챕터별 발표/질문",
    dateISO: "2025-09-10T19:00",
    durationMin: 120,
    host: "min",
    capacity: "4/8",
  },
  {
    badge: "모집중",
    category: "네트워크",
    title: "네트워크 기초 스터디",
    desc: "OSI 7계층, TCP/UDP",
    dateISO: "2025-09-07T10:00",
    durationMin: 60,
    host: "jay",
    capacity: "3/7",
  },
  {
    badge: "모집중",
    category: "웹/프론트엔드",
    title: "리액트 훅/상태관리",
    desc: "라우팅까지 훑기",
    dateISO: "2025-09-12T20:00",
    durationMin: 90,
    host: "ara",
    capacity: "2/6",
  },
  {
    badge: "모집중",
    category: "코딩테스트",
    title: "주 5일 코테 루틴",
    desc: "프로그래머스 중심",
    dateISO: "2025-09-06T09:00",
    durationMin: 30,
    host: "kim",
    capacity: "5/10",
  },
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },
  {
    badge: "모집중",
    category: "자료구조/알고리즘",
    title: "알고리즘 스터디 A",
    desc: "1일 1문제, 주 3회 온라인",
    dateISO: "2025-09-05T14:00",
    durationMin: 60,
    host: "sally",
    capacity: "2/6",
  },
]; */
const payload =
  window.__PAYLOAD ||
  (document.getElementById("payload")
    ? JSON.parse(document.getElementById("payload").textContent)
    : {});
const { categories: CS_CATEGORIES = [], studies = [] } = payload;

const PAGE_SIZE = 6;
let currentPage = 1;
const selectedCategories = new Set();
const filterState = { dateFrom: "", timeFrom: "", duration: "" };

const cardsEl = document.getElementById("cards");
const paginationEl = document.getElementById("pagination");
const categoryListEl = document.getElementById("categoryList");
const dateFromEl = document.getElementById("dateFrom");
const timeFromEl = document.getElementById("timeFrom");
const durationEl = document.getElementById("duration");
const resetBtnEl = document.getElementById("resetBtn");
const sortLatestBtn = document.getElementById("sort-latest");
const sortOldestBtn = document.getElementById("sort-oldest");

if (sortLatestBtn) {
  sortLatestBtn.addEventListener("click", () => {
    sortOrder = "latest";
    goToPage(1);
    render();
  });
}
if (sortOldestBtn) {
  sortOldestBtn.addEventListener("click", () => {
    sortOrder = "oldest";
    goToPage(1);
    render();
  });
}

CS_CATEGORIES.forEach((name, i) => {
  const id = `cat-${i}`;
  const row = document.createElement("label");
  row.className = "flex items-center gap-2 cursor-pointer";
  row.innerHTML = `
    <input id="${id}" type="checkbox" value="${name}"
           class="h-4 w-4 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]" />
    <span>${name}</span>
  `;
  row.querySelector("input").addEventListener("change", (e) => {
    if (e.target.checked) selectedCategories.add(e.target.value);
    else selectedCategories.delete(e.target.value);
    goToPage(1);
    render();
  });
  categoryListEl.appendChild(row);
});
let sortOrder = "latest"; // 기본은 최신순
document.getElementById("sort-latest").addEventListener("click", () => {
  sortOrder = "latest";
  goToPage(1);
  render();
});

document.getElementById("sort-oldest").addEventListener("click", () => {
  sortOrder = "oldest";
  goToPage(1);
  render();
});

dateFromEl.addEventListener("input", () => {
  filterState.dateFrom = dateFromEl.value; // YYYY-MM-DD 또는 ""
  goToPage(1);
  render();
});

timeFromEl.addEventListener("input", () => {
  filterState.timeFrom = timeFromEl.value;
  goToPage(1);
  render();
});

durationEl.addEventListener("change", () => {
  filterState.duration = durationEl.value; // "30" | "60" | ... | ""
  goToPage(1);
  render();
});

resetBtnEl.addEventListener("click", () => {
  selectedCategories.clear();
  Array.from(categoryListEl.querySelectorAll("input[type=checkbox]")).forEach(
    (chk) => (chk.checked = false)
  );
  dateFromEl.value = "";
  timeFromEl.value = "";
  durationEl.value = "";
  filterState.dateFrom = "";
  filterState.timeFrom = "";
  filterState.duration = "";
  goToPage(1);
  render();
});

function withinDateRange(iso) {
  if (!iso) return true;
  if (!filterState.dateFrom) return true; // 시작일 선택 안 했으면 무조건 통과

  const d = new Date(iso);
  const from = new Date(filterState.dateFrom);

  if (filterState.timeFrom) {
    const [hh, mm] = filterState.timeFrom.split(":");
    from.setHours(hh, mm, 0, 0);
  }

  return d >= from;
}

function matchesDuration(min) {
  if (!filterState.duration) return true;
  return String(min) === filterState.duration;
}

function matchesCategory(cat) {
  if (selectedCategories.size === 0) return true;
  return selectedCategories.has(cat);
}

function getVisibleStudies() {
  // 모집중만 보기
  let list = studies.filter(
    (s) =>
      s.badge === "모집중" &&
      matchesCategory(s.category) &&
      withinDateRange(s.dateISO) &&
      matchesDuration(s.durationMin)
  );
  list.sort((a, b) => {
    if (sortOrder === "latest") {
      return new Date(b.dateISO) - new Date(a.dateISO); // 큰 날짜(최신)가 앞으로
    } else {
      return new Date(a.dateISO) - new Date(b.dateISO); // 작은 날짜(오래된)가 앞으로
    }
  });

  return list;
}

function render() {
  const visible = getVisibleStudies();

  // 카드
  cardsEl.innerHTML = "";
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = visible.slice(start, start + PAGE_SIZE);
  pageItems.forEach((item) => cardsEl.appendChild(cardEl(item)));

  // 플레이스홀더로 행 채우기(레이아웃 유지)
  const placeholders = PAGE_SIZE - pageItems.length;
  for (let i = 0; i < placeholders; i++) {
    cardsEl.appendChild(placeholderEl());
  }

  // 페이지네이션
  renderPagination(visible.length);
}

function renderPagination(totalCount) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  paginationEl.innerHTML = "";

  paginationEl.appendChild(
    pagerBtn("이전", () => goToPage(currentPage - 1), currentPage === 1)
  );
  for (let i = 1; i <= totalPages; i++) {
    const b = document.createElement("button");
    b.className =
      "w-10 h-10 px-3 rounded-lg border text-sm " +
      (i === currentPage
        ? "bg-[var(--brand)] text-white border-transparent"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100");
    b.textContent = i;
    b.onclick = () => {
      goToPage(i);
      render();
    };
    paginationEl.appendChild(b);
  }
  paginationEl.appendChild(
    pagerBtn(
      "다음",
      () => goToPage(currentPage + 1),
      currentPage === totalPages
    )
  );
}

function goToPage(n) {
  const total = Math.max(1, Math.ceil(getVisibleStudies().length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, n), total);
}

function pagerBtn(label, onClick, disabled = false) {
  const b = document.createElement("button");
  b.textContent = label;
  b.className =
    "h-10 px-4 rounded-lg border text-sm " +
    (disabled
      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100");
  b.disabled = disabled;
  b.onclick = () => {
    if (disabled) return;
    onClick(); // goToPage(...)
    render(); // ✅ 페이지 갱신
  };
  return b;
}
function cardEl(item) {
  const el = document.createElement("article");
  el.className =
    "h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col";
  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">${item.badge}</span>
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">${item.category}</span>
      </div>
      <span class="text-sm text-gray-500">👥 ${item.capacity}</span>
    </div>

    <h3 class="mt-4 text-lg font-extrabold text-gray-800 wrap-anywhere">${item.title}</h3>

    <p class="pt-6 text-sm leading-7 text-gray-600 wrap-anywhere">
      ${item.desc}
    </p>

    <div class="mt-auto pt-6 flex items-center gap-3 text-sm text-gray-600">
      <span>👤 ${item.host}</span>
      <span>📅 ${item.dateISO}</span>
      <span>⏱ ${item.durationMin}분</span>
    </div>
  `;
  return el;
}

function placeholderEl() {
  const el = document.createElement("article");
  el.className =
    "bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex items-center justify-center min-h-[168px]";
  el.innerHTML = `<div class="text-center"><p class="text-gray-400 text-sm">조건에 맞는 스터디가 없어요</p></div>`;
  return el;
}

render();
