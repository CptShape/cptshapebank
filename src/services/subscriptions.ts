import { SubscriptionInterval } from "../types";

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function parseDateOnly(value: string) {
  const [rawYear = "1970", rawMonth = "1", rawDay = "1"] = value.split("-");
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  return new Date(year, Math.max(month - 1, 0), day, 12, 0, 0, 0);
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function addInterval(dateIso: string, interval: SubscriptionInterval) {
  const date = parseDateOnly(dateIso);
  if (interval === "daily") {
    date.setDate(date.getDate() + 1);
  }
  if (interval === "weekly") {
    date.setDate(date.getDate() + 7);
  }
  if (interval === "monthly") {
    date.setMonth(date.getMonth() + 1);
  }
  if (interval === "quarterly") {
    date.setMonth(date.getMonth() + 3);
  }
  if (interval === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString().slice(0, 10);
}

export function isDue(dateIso: string) {
  return parseDateOnly(dateIso).getTime() <= parseDateOnly(todayIso()).getTime();
}

export function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function addDays(dateIso: string, days: number) {
  const date = parseDateOnly(dateIso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function lastMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const end = new Date(date.getFullYear(), date.getMonth(), 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function subtractMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() - months, date.getDate());
}

export function compareDateOnly(left: string, right: string) {
  return parseDateOnly(left).getTime() - parseDateOnly(right).getTime();
}

export function normalizeDateOnly(value: string) {
  return parseDateOnly(value).toISOString().slice(0, 10);
}

export function toIsoFromDateAndTime(dateIso: string, hour: string, minute: string) {
  const base = parseDateOnly(dateIso);
  base.setHours(Number(hour), Number(minute), 0, 0);
  return base.toISOString();
}

export function datePartFromIso(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function timePartsFromIso(iso: string) {
  const date = new Date(iso);
  return {
    hour: `${date.getHours()}`.padStart(2, "0"),
    minute: `${date.getMinutes()}`.padStart(2, "0"),
  };
}
