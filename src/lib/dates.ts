export function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

export function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}
