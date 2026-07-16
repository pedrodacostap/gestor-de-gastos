import { getTodayValue } from "./dates";

type FinancialMovement = {
  amount: number | string;
  transaction_date?: string;
  type: "expense" | "income";
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateAccountBalance(
  initialBalance: number,
  movements: FinancialMovement[],
  asOfDate = getTodayValue(),
) {
  return roundMoney(
    movements
      .filter(
        (movement) =>
          !movement.transaction_date || movement.transaction_date <= asOfDate,
      )
      .reduce(
      (balance, movement) =>
        movement.type === "income"
          ? balance + Number(movement.amount)
          : balance - Number(movement.amount),
      Number(initialBalance),
      ),
  );
}

export function splitInstallments(total: number, count: number) {
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("O valor total deve ser maior que zero.");
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("A quantidade de parcelas deve ser um inteiro maior que zero.");
  }

  const baseAmount = roundMoney(total / count);
  return Array.from({ length: count }, (_, index) =>
    index === count - 1
      ? roundMoney(total - baseAmount * (count - 1))
      : baseAmount,
  );
}

export function applyGoalMovement(
  currentAmount: number,
  amount: number,
  type: "deposit" | "withdrawal",
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("O valor da movimentação deve ser maior que zero.");
  }
  if (type === "withdrawal" && amount > currentAmount) {
    throw new Error("A retirada não pode ser maior que o valor atual da meta.");
  }
  return roundMoney(type === "deposit" ? currentAmount + amount : currentAmount - amount);
}

export function getEffectiveDebtPayment(remainingBalance: number, requestedAmount: number) {
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new Error("O valor do pagamento deve ser maior que zero.");
  }
  if (!Number.isFinite(remainingBalance) || remainingBalance <= 0) {
    throw new Error("Esta dívida já está quitada.");
  }
  return roundMoney(Math.min(remainingBalance, requestedAmount));
}
