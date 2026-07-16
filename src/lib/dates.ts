export function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getPreviousMonthValue(monthValue = getCurrentMonthValue()) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getMonthRange(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    endDate: end.toISOString().slice(0, 10),
    startDate: start.toISOString().slice(0, 10),
  };
}

export function addMonths(monthValue: string, amount: number) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dateToMonthValue(dateValue: string) {
  return dateValue.slice(0, 7);
}

export function getInvoiceMonth(purchaseDate: string, closingDay: number) {
  const day = Number(purchaseDate.slice(8, 10));
  const purchaseMonth = dateToMonthValue(purchaseDate);

  return day > closingDay ? addMonths(purchaseMonth, 1) : purchaseMonth;
}

export function getInvoiceMonthDate(monthValue: string) {
  return `${monthValue}-01`;
}

export function getInvoiceDueDate(monthValue: string, dueDay: number) {
  const [year, month] = monthValue.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const safeDay = Math.min(dueDay, lastDay);

  return `${monthValue}-${String(safeDay).padStart(2, "0")}`;
}

export function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function getMonthLabel(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
    year: "2-digit",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function getRecentMonths(monthValue: string, count: number) {
  const [year, month] = monthValue.split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - count + index, 1));

    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}
