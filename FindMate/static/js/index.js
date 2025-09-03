// SSR payload 읽기 (없으면 안전 기본값) ----------------------------
function readPayload() {
  const el = document.getElementById("payload");
  try {
    if (window.__PAYLOAD) return window.__PAYLOAD;
    return el ? JSON.parse(el.textContent) : {};
  } catch {
    return {};
  }
}

const payload = readPayload();
const rawCats = Array.isArray(payload.categories) ? payload.categories : [];
const studies = Array.isArray(payload.studies) ? payload.studies : [];
let sortOrder = payload.sortOrder === "oldest" ? "oldest" : "latest";

// 카테고리 정규화 & 맵 
function slugify(name) {
  return String(name)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[\/_]/g, "-")
    .toLowerCase();
}
const categories = rawCats.map((c, i) =>
  typeof c === "string" ? { key: slugify(c), name: c, order: i + 1 } : c
);
const catKeyToName = new Map(categories.map((c) => [c.key, c.name]));

// 상태 & 엘리먼트 
const PAGE_SIZE = 6;
let currentPage = 1;
const selectedCategories = new Set(); // key 집합
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

// 카테고리 렌더링 (name 표시, key 값) 
function renderCategories() {
  if (!categoryListEl) return;
  categoryListEl.innerHTML = "";
  categories.forEach((c, i) => {
    const id = `cat-${i}`;
    const row = document.createElement("label");
    row.className = "flex items-center gap-2 cursor-pointer";
    row.innerHTML = `
      <input id="${id}" type="checkbox" value="${c.key}"
             class="h-4 w-4 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]" />
      <span>${c.name}</span>
    `;
    row.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) selectedCategories.add(c.key);
      else selectedCategories.delete(c.key);
      goToPage(1);
      render();
    });
    categoryListEl.appendChild(row);
  });
}

// 필터 유틸 
function resolveItemCatKey(cat) {
  // studies에 category가 "key"로 올 수도, "name"으로 올 수도 있으니 둘 다 대응
  if (catKeyToName.has(cat)) return cat; // 이미 key
  const found = categories.find((c) => c.name === cat);
  return found ? found.key : cat; // 못 찾으면 원본 반환(필터 미적용)
}

function withinDateRange(iso) {
  if (!iso || !filterState.dateFrom) return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return true; // 이상한 날짜면 통과
  const from = new Date(filterState.dateFrom);
  if (filterState.timeFrom) {
    const [hh, mm] = filterState.timeFrom.split(":");
    from.setHours(+hh || 0, +mm || 0, 0, 0);
  }
  return d >= from;
}

function matchesDuration(min) {
  if (!filterState.duration) return true;
  return String(min) === filterState.duration;
}

function matchesCategory(cat) {
  if (selectedCategories.size === 0) return true;
  const key = resolveItemCatKey(cat);
  return selectedCategories.has(key);
}

// 6) 목록/정렬/페이지 
function getVisibleStudies() {
  let list = studies.filter(
    (s) =>
      (s.badge ? s.badge === "모집중" : true) && // badge 없으면 통과
      matchesCategory(s.category) &&
      withinDateRange(s.dateISO) &&
      matchesDuration(s.durationMin)
  );
  list.sort((a, b) => {
    const da = new Date(a.dateISO);
    const db = new Date(b.dateISO);
    const aTime = Number.isNaN(da.getTime()) ? 0 : da.getTime();
    const bTime = Number.isNaN(db.getTime()) ? 0 : db.getTime();
    return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
  });
  return list;
}

function goToPage(n) {
  const total = Math.max(1, Math.ceil(getVisibleStudies().length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, n), total);
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
    pagerBtn("다음", () => goToPage(currentPage + 1), currentPage === totalPages)
  );
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
    onClick();
    render();
  };
  return b;
}

// 7) 카드 렌더
function cardEl(item) {
  const el = document.createElement("article");
  el.className =
    "h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col " +
    "cursor-pointer transition hover:shadow-md hover:-translate-y-0.5";
  el.setAttribute("role", "button");
  el.tabIndex = 0;

  const displayCat =
    catKeyToName.get(resolveItemCatKey(item.category)) ?? String(item.category ?? "");

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        ${
          item.badge
            ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">${item.badge}</span>`
            : ""
        }
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">${displayCat}</span>
      </div>
      <span class="text-sm text-gray-500">👥 ${item.applicants}/${item.capacity ?? "-"}</span>
    </div>

    <h3 class="mt-4 text-base sm:text-lg font-bold leading-tight clamp-1">${item.title ?? ""}</h3>

    <p class="mt-4 text-sm text-gray-600 clamp-2">
      ${item.desc ?? ""}
    </p>

    <div class="mt-auto pt-6 flex items-center gap-3 text-sm text-gray-600">
      <span>👤 ${item.host ?? ""}</span>
      <span>📅 ${(
    item.dateISO ?? ""
  )
    .toString()
    .replace("T", " ")     // T → 공백
    .replace(/:\d{2}(?=(\s|$|Z))/, "") // 끝쪽 초(:SS) 제거
    .replace(/Z$/, "")} </span>
      <span>⏱ ${item.durationMin ?? ""}분</span>
    </div>
  `;

  const to = `/study/${item.id}`;
  const go = () => { window.location.href = to; };
  el.addEventListener("click", go);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") go();
  });

  return el;
}

function placeholderEl() {
  const el = document.createElement("article");
  el.className =
    "bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex items-center justify-center min-h-[168px]";
  el.innerHTML = `<div class="text-center"><p class="text-gray-400 text-sm">조건에 맞는 스터디가 없어요</p></div>`;
  return el;
}

// 메인 렌더 
function render() {
  const visible = getVisibleStudies();
  // 카드
  cardsEl.innerHTML = "";
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = visible.slice(start, start + PAGE_SIZE);
  pageItems.forEach((item) => cardsEl.appendChild(cardEl(item)));
  // 플레이스홀더
  for (let i = pageItems.length; i < PAGE_SIZE; i++) {
    cardsEl.appendChild(placeholderEl());
  }
  // 페이지네이션
  renderPagination(visible.length);
}

// 이벤트 바인딩 
function bindEvents() {
  if (sortLatestBtn)
    sortLatestBtn.addEventListener("click", () => {
      sortOrder = "latest";
      goToPage(1);
      render();
    });
  if (sortOldestBtn)
    sortOldestBtn.addEventListener("click", () => {
      sortOrder = "oldest";
      goToPage(1);
      render();
    });

  if (dateFromEl)
    dateFromEl.addEventListener("input", () => {
      filterState.dateFrom = dateFromEl.value; // YYYY-MM-DD | ""
      goToPage(1);
      render();
    });
  if (timeFromEl)
    timeFromEl.addEventListener("input", () => {
      filterState.timeFrom = timeFromEl.value;
      goToPage(1);
      render();
    });
  if (durationEl)
    durationEl.addEventListener("change", () => {
      filterState.duration = durationEl.value; // "30" | "60" | ... | ""
      goToPage(1);
      render();
    });
  if (resetBtnEl)
    resetBtnEl.addEventListener("click", () => {
      selectedCategories.clear();
      document
        .querySelectorAll("#categoryList input[type=checkbox]")
        .forEach((chk) => (chk.checked = false));
      dateFromEl && (dateFromEl.value = "");
      timeFromEl && (timeFromEl.value = "");
      durationEl && (durationEl.value = "");
      filterState.dateFrom = "";
      filterState.timeFrom = "";
      filterState.duration = "";
      goToPage(1);
      render();
    });
}

// 초기화 
function init() {
  renderCategories();
  bindEvents();
  render();
}
document.addEventListener("DOMContentLoaded", init);
