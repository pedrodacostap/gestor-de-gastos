import { describe, expect, it } from "vitest";
import type { RecurringTransaction, Transaction } from "../types/database";
import {
  advanceRecurringDate,
  buildBalanceForecast,
  buildReportSummary,
} from "./insightRules";

function recurring(
  overrides: Partial<RecurringTransaction> = {},
): RecurringTransaction {
  return {
    account_id: "account",
    amount: 100,
    category_id: null,
    created_at: "2026-01-01T00:00:00Z",
    end_date: null,
    frequency: "monthly",
    id: "recurring",
    interval_count: 1,
    is_active: true,
    next_due_date: "2026-01-31",
    notes: null,
    payment_method: null,
    start_date: "2026-01-31",
    title: "Conta mensal",
    type: "expense",
    updated_at: "2026-01-01T00:00:00Z",
    user_id: "user",
    ...overrides,
  };
}

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    account_id: "account",
    amount: 100,
    category_id: null,
    created_at: "2026-01-01T00:00:00Z",
    id: crypto.randomUUID(),
    notes: null,
    payment_method: null,
    title: "Movimentação",
    transaction_date: "2026-01-10",
    type: "expense",
    updated_at: "2026-01-01T00:00:00Z",
    user_id: "user",
    ...overrides,
  };
}

describe("recorrências e projeções", () => {
  it("preserva o dia âncora após um mês mais curto", () => {
    expect(advanceRecurringDate("2026-01-31", "monthly", 1, "2026-01-31")).toBe(
      "2026-02-28",
    );
    expect(advanceRecurringDate("2026-02-28", "monthly", 1, "2026-01-31")).toBe(
      "2026-03-31",
    );
  });

  it("preserva 29 de fevereiro quando o próximo ano é bissexto", () => {
    expect(advanceRecurringDate("2027-02-28", "yearly", 1, "2024-02-29")).toBe(
      "2028-02-29",
    );
  });

  it("projeta receitas e despesas no saldo", () => {
    const points = buildBalanceForecast(
      1_000,
      [
        recurring({ amount: 250, next_due_date: "2026-07-20" }),
        recurring({
          amount: 500,
          next_due_date: "2026-07-18",
          start_date: "2026-07-18",
          title: "Receita",
          type: "income",
        }),
      ],
      "2026-07-16",
      7,
    );

    expect(points.at(-1)?.balance).toBe(1_250);
    expect(points.find((point) => point.date === "2026-07-18")?.income).toBe(500);
    expect(points.find((point) => point.date === "2026-07-20")?.expenses).toBe(250);
  });
});

describe("relatórios", () => {
  it("resume o período, categorias e meses sem movimentação", () => {
    const data = buildReportSummary(
      [
        transaction({ amount: 1_000, transaction_date: "2026-01-05", type: "income" }),
        transaction({ amount: 300, category_id: "food", transaction_date: "2026-03-05" }),
      ],
      [
        {
          color: "#ff9f0a",
          created_at: "2026-01-01T00:00:00Z",
          icon: null,
          id: "food",
          name: "Alimentação",
          type: "expense",
          user_id: "user",
        },
      ],
      "2026-01-01",
      "2026-03-31",
    );

    expect(data.result).toBe(700);
    expect(data.savingsRate).toBe(70);
    expect(data.monthlyEvolution).toHaveLength(3);
    expect(data.monthlyEvolution[1].result).toBe(0);
    expect(data.categoryExpenses[0]).toMatchObject({
      name: "Alimentação",
      percent: 100,
      total: 300,
    });
  });
});
