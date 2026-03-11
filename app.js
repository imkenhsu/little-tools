const STORAGE_KEY = "purchaseRecords";

const form = document.getElementById("purchase-form");
const recordsBody = document.getElementById("records-body");
const emptyText = document.getElementById("empty");
const totalText = document.getElementById("total");
const clearAllBtn = document.getElementById("clear-all");

function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatCurrency(value) {
  return `¥${value.toFixed(2)}`;
}

function computeDaysUsed(purchaseDate) {
  const oneDayMs = 1000 * 60 * 60 * 24;
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const purchase = new Date(`${purchaseDate}T00:00:00`);
  const delta = Math.floor((todayMid - purchase) / oneDayMs);
  return Math.max(1, delta + 1);
}

function render() {
  const records = loadRecords();
  recordsBody.innerHTML = "";

  if (records.length === 0) {
    emptyText.style.display = "block";
  } else {
    emptyText.style.display = "none";
  }

  let total = 0;

  records.forEach((record, index) => {
    const daysUsed = computeDaysUsed(record.purchaseDate);
    const dailyCost = record.price / daysUsed;
    total += record.price;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${record.item}</td>
      <td>${record.purchaseDate}</td>
      <td>${formatCurrency(record.price)}</td>
      <td>${daysUsed}</td>
      <td>${formatCurrency(dailyCost)}</td>
      <td><button class="row-delete" data-index="${index}">删除</button></td>
    `;
    recordsBody.appendChild(tr);
  });

  totalText.textContent = `总支出：${formatCurrency(total)}`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const item = String(formData.get("item") || "").trim();
  const purchaseDate = String(formData.get("purchaseDate") || "").trim();
  const price = Number(formData.get("price"));

  if (!item || !purchaseDate || Number.isNaN(price) || price <= 0) {
    alert("请填写有效的物品、购买日期和价格。价格必须大于 0。");
    return;
  }

  const records = loadRecords();
  records.push({ item, purchaseDate, price: Number(price.toFixed(2)) });
  saveRecords(records);

  form.reset();
  render();
});

recordsBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  if (!target.classList.contains("row-delete")) return;

  const index = Number(target.dataset.index);
  const records = loadRecords();
  records.splice(index, 1);
  saveRecords(records);
  render();
});

clearAllBtn.addEventListener("click", () => {
  if (!confirm("确定清空所有记录吗？")) return;
  saveRecords([]);
  render();
});

render();
