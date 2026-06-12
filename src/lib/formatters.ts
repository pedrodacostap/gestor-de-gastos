export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00`));
}
