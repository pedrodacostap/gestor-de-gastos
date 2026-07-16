import { describe, expect, it } from "vitest";
import {
  applyGoalMovement,
  calculateAccountBalance,
  getEffectiveDebtPayment,
  splitInstallments,
} from "./financialRules";

describe("regras financeiras", () => {
  it("calcula o saldo pela fonte de verdade da conta", () => {
    expect(
      calculateAccountBalance(1_000, [
        { amount: 200, type: "income" },
        { amount: 350, type: "expense" },
        { amount: "49.90", type: "expense" },
      ]),
    ).toBe(800.1);
  });

  it("não antecipa no saldo uma transação com data futura", () => {
    expect(
      calculateAccountBalance(
        1_000,
        [
          { amount: 100, transaction_date: "2026-07-15", type: "expense" },
          { amount: 500, transaction_date: "2026-08-01", type: "expense" },
        ],
        "2026-07-16",
      ),
    ).toBe(900);
  });

  it("divide parcelas preservando o total até o último centavo", () => {
    const installments = splitInstallments(100, 3);
    expect(installments).toEqual([33.33, 33.33, 33.34]);
    expect(installments.reduce((sum, amount) => sum + amount, 0)).toBe(100);
  });

  it("aplica aporte e retirada de meta", () => {
    expect(applyGoalMovement(500, 125.5, "deposit")).toBe(625.5);
    expect(applyGoalMovement(500, 125.5, "withdrawal")).toBe(374.5);
  });

  it("rejeita retirada maior que o valor atual da meta", () => {
    expect(() => applyGoalMovement(100, 100.01, "withdrawal")).toThrow(
      "A retirada não pode ser maior",
    );
  });

  it("limita o pagamento ao saldo restante da dívida", () => {
    expect(getEffectiveDebtPayment(80, 120)).toBe(80);
    expect(getEffectiveDebtPayment(80, 30)).toBe(30);
  });

  it("rejeita valores financeiros inválidos", () => {
    expect(() => splitInstallments(0, 2)).toThrow();
    expect(() => applyGoalMovement(100, -1, "deposit")).toThrow();
    expect(() => getEffectiveDebtPayment(0, 10)).toThrow();
  });
});
