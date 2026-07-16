const formatters = new Map<string, Intl.NumberFormat>();

function getCurrency() {
  if (typeof window === "undefined") return "BRL";
  try {
    const preferences = JSON.parse(
      window.localStorage.getItem("gestor-de-gastos:preferences") ?? "{}",
    ) as { currency?: string };
    return ["BRL", "USD", "EUR"].includes(preferences.currency ?? "")
      ? preferences.currency!
      : "BRL";
  } catch {
    return "BRL";
  }
}

export function formatCurrency(value: number) {
  const currency = getCurrency();
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("pt-BR", { currency, style: "currency" });
    formatters.set(currency, formatter);
  }
  return formatter.format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00`));
}
