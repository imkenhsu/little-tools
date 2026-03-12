export const STORAGE_KEY = "purchaseRecords.v2";

export function createRecordId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `record-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatCurrency(value) {
  const amount = Number(value);
  return `¥${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
}

export function parsePositivePrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return null;
  return Number(price.toFixed(2));
}

export function normalizeCategory(value) {
  if (typeof value !== "string") return "未分类";
  const category = value.trim();
  return category || "未分类";
}

export function isValidDateInput(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const date = new Date(year, month - 1, day);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isFutureDate(value) {
  if (!isValidDateInput(value)) return false;

  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const date = new Date(`${value}T00:00:00`);
  return date.getTime() > dayStart.getTime();
}

export function computeDaysUsed(purchaseDate) {
  if (!isValidDateInput(purchaseDate) || isFutureDate(purchaseDate)) {
    return null;
  }

  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const purchase = new Date(`${purchaseDate}T00:00:00`);
  const diff = Math.floor((dayStart.getTime() - purchase.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

export function dailyCost(record) {
  const days = computeDaysUsed(record.purchaseDate);
  if (!days) return "--";
  return formatCurrency(record.price / days);
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") return null;

  const item = typeof record.item === "string" ? record.item.trim() : "";
  const purchaseDate = typeof record.purchaseDate === "string" ? record.purchaseDate : "";
  const price = parsePositivePrice(record.price);
  const category = normalizeCategory(record.category);

  if (!item || !isValidDateInput(purchaseDate) || !price) {
    return null;
  }

  return {
    id: typeof record.id === "string" && record.id ? record.id : createRecordId(),
    item,
    category,
    purchaseDate,
    price
  };
}

export function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecord).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function exportRecords(records) {
  return JSON.stringify(records, null, 2);
}

export function importRecords(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { records: [], error: "导入内容必须是记录数组。" };
    }

    const records = parsed.map(normalizeRecord).filter(Boolean);
    if (records.length === 0) {
      return { records: [], error: "没有找到可导入的有效记录。" };
    }

    return { records, error: "" };
  } catch {
    return { records: [], error: "导入内容不是有效的 JSON。" };
  }
}
