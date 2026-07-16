import type { Category, RecurringTransaction, Transaction } from "../types/database";
import type {
  FinancialReportData,
  ForecastPoint,
  RecurringFrequency,
} from "../types/insights";
import { getMonthLabel } from "./dates";

function toUtcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function toDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addDays(value: string, amount: number) {
  const date = toUtcDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateValue(date);
}

export function advanceRecurringDate(
  currentDate: string,
  frequency: RecurringFrequency,
  intervalCount: number,
  anchorDate: string,
) {
  if (!Number.isInteger(intervalCount) || intervalCount < 1) {
    throw new Error("O intervalo da recorrência deve ser maior que zero.");
  }

  if (frequency === "weekly") {
    return addDays(currentDate, intervalCount * 7);
  }

  const current = toUtcDate(currentDate);
  const anchor = toUtcDate(anchorDate);

  if (frequency === "monthly") {
    const target = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + intervalCount, 1),
    );
    target.setUTCDate(
      Math.min(
        anchor.getUTCDate(),
        daysInMonth(target.getUTCFullYear(), target.getUTCMonth()),
      ),
    );
    return toDateValue(target);
  }

  const targetYear = current.getUTCFullYear() + intervalCount;
  const targetMonth = anchor.getUTCMonth();
  const target = new Date(Date.UTC(targetYear, targetMonth, 1));
  target.setUTCDate(
    Math.min(anchor.getUTCDate(), daysInMonth(targetYear, targetMonth)),
  );
  return toDateValue(target);
}

export function buildBalanceForecast(
  currentBalance: number,
  recurringTransactions: RecurringTransaction[],
  startDate: string,
  days = 90,
): ForecastPoint[] {
  const endDate = addDays(startDate, Math.max(days, 1) - 1);
  const events = new Map<string, { expenses: number; income: number }>();

  recurringTransactions
    .filter((item) => item.is_active)
    .forEach((item) => {
      let dueDate = item.next_due_date;
      let guard = 0;

      while (dueDate < startDate && guard < 5000) {
        dueDate = advanceRecurringDate(
          dueDate,
          item.frequency,
          item.interval_count,
          item.start_date,
        );
        guard += 1;
      }

      while (
        dueDate <= endDate &&
        (!item.end_date || dueDate <= item.end_date) &&
        guard < 5000
      ) {
        const event = events.get(dueDate) ?? { expenses: 0, income: 0 };
        if (item.type === "income") {
          event.income += Number(item.amount);
        } else {
          event.expenses += Number(item.amount);
        }
        events.set(dueDate, event);
        dueDate = advanceRecurringDate(
          dueDate,
          item.frequency,
          item.interval_count,
          item.start_date,
        );
        guard += 1;
      }
    });

  let balance = currentBalance;
  return Array.from({ length: Math.max(days, 1) }, (_, index) => {
    const date = addDays(startDate, index);
    const event = events.get(date) ?? { expenses: 0, income: 0 };
    balance += event.income - event.expenses;

    return {
      balance: Math.round(balance * 100) / 100,
      date,
      expenses: event.expenses,
      income: event.income,
      label: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      }).format(toUtcDate(date)),
    };
  });
}

export function buildReportSummary(
  transactions: Transaction[],
  categories: Category[],
  startDate: string,
  endDate: string,
): Pick<
  FinancialReportData,
  "categoryExpenses" | "expenses" | "income" | "monthlyEvolution" | "result" | "savingsRate"
> {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const result = income - expenses;
  const monthKeys: string[] = [];
  let cursor = `${startDate.slice(0, 7)}-01`;
  const lastMonth = endDate.slice(0, 7);

  while (cursor.slice(0, 7) <= lastMonth) {
    monthKeys.push(cursor.slice(0, 7));
    const date = toUtcDate(cursor);
    date.setUTCMonth(date.getUTCMonth() + 1);
    cursor = toDateValue(date);
  }

  const monthlyEvolution = monthKeys.map((month) => {
    const monthTransactions = transactions.filter((transaction) =>
      transaction.transaction_date.startsWith(month),
    );
    const monthIncome = monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const monthExpenses = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return {
      expenses: monthExpenses,
      income: monthIncome,
      label: getMonthLabel(month),
      month,
      result: monthIncome - monthExpenses,
    };
  });

  const categoryGroups = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((groups, transaction) => {
      const key = transaction.category_id ?? "sem-categoria";
      groups[key] = (groups[key] ?? 0) + Number(transaction.amount);
      return groups;
    }, {});

  const categoryExpenses = Object.entries(categoryGroups)
    .map(([categoryId, total]) => {
      const category = categories.find((item) => item.id === categoryId);
      return {
        color: category?.color ?? null,
        name: category?.name ?? "Sem categoria",
        percent: expenses > 0 ? (total / expenses) * 100 : 0,
        total,
      };
    })
    .sort((left, right) => right.total - left.total);

  return {
    categoryExpenses,
    expenses,
    income,
    monthlyEvolution,
    result,
    savingsRate: income > 0 ? (result / income) * 100 : 0,
  };
}
