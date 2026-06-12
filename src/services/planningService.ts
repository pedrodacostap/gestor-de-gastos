import { addMonths, getCurrentMonthValue, getInvoiceDueDate, getMonthRange } from "../lib/dates";
import { supabase } from "../lib/supabase/client";
import type {
  Debt,
  DebtPayment,
  EmergencyReserveSettings,
  Goal,
  GoalMovement,
  Transaction,
} from "../types/database";
import type {
  DebtInput,
  DebtPaymentInput,
  DebtWithSummary,
  EmergencyReserveInput,
  EmergencyReserveSummary,
  GoalInput,
  GoalMovementInput,
  GoalWithSummary,
  PlanningDashboardSummary,
  PlanningDataBundle,
} from "../types/planning";

type SupabaseErrorLike = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

function assertNoError(error: unknown) {
  if (!error) return;
  if (error instanceof Error) throw error;
  if (typeof error === "object" && "message" in error) {
    const supabaseError = error as SupabaseErrorLike;
    throw new Error(
      [
        supabaseError.message,
        supabaseError.details ? `Detalhes: ${supabaseError.details}` : null,
        supabaseError.hint ? `Dica: ${supabaseError.hint}` : null,
        supabaseError.code ? `Código: ${supabaseError.code}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
  throw new Error("Não foi possível concluir a operação.");
}

function percent(current: number, target: number) {
  return target > 0 ? Math.min((current / target) * 100, 100) : 0;
}

function buildGoalSummary(goal: Goal, movements: GoalMovement[]): GoalWithSummary {
  const deposits = movements
    .filter((movement) => movement.type === "deposit")
    .reduce((sum, movement) => sum + Number(movement.amount), 0);
  const missingAmount = Math.max(Number(goal.target_amount) - Number(goal.current_amount), 0);
  const monthlyAverage = deposits > 0 ? deposits / Math.max(movements.length, 1) : 0;
  const monthsToFinish = monthlyAverage > 0 ? Math.ceil(missingAmount / monthlyAverage) : null;

  return {
    ...goal,
    forecast_date: monthsToFinish ? `${addMonths(getCurrentMonthValue(), monthsToFinish)}-01` : null,
    missing_amount: missingAmount,
    movements,
    progress_percent: percent(Number(goal.current_amount), Number(goal.target_amount)),
  };
}

function buildDebtSummary(debt: Debt, payments: DebtPayment[]): DebtWithSummary {
  const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const month = getCurrentMonthValue();

  return {
    ...debt,
    high_interest: Number(debt.monthly_interest_rate) >= 3,
    is_paid: Number(debt.remaining_balance) <= 0,
    next_due_date: getInvoiceDueDate(month, debt.due_day),
    paid_amount: paidAmount,
    payments,
    progress_percent: percent(
      Number(debt.original_amount) - Number(debt.remaining_balance),
      Number(debt.original_amount),
    ),
  };
}

async function ensureEmergencySettings(userId: string) {
  const { data, error } = await supabase
    .from("emergency_reserve_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  assertNoError(error);
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("emergency_reserve_settings")
    .insert({ target_months: 6, user_id: userId })
    .select("*")
    .single();

  assertNoError(createError);
  return created;
}

async function getEmergencyReserveSummary(
  userId: string,
  goals: Goal[],
): Promise<EmergencyReserveSummary> {
  const settings = await ensureEmergencySettings(userId);
  const currentMonth = getCurrentMonthValue();
  const startMonth = addMonths(currentMonth, -5);
  const { startDate } = getMonthRange(startMonth);
  const { endDate } = getMonthRange(currentMonth);
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  assertNoError(error);

  const totalExpenses = (transactions ?? []).reduce(
    (sum: number, transaction: Transaction) => sum + Number(transaction.amount),
    0,
  );
  const monthlyExpenseAverage = totalExpenses / 6;
  const linkedGoal =
    goals.find((goal) => goal.id === settings?.linked_goal_id) ?? null;
  const currentAmount = Number(linkedGoal?.current_amount ?? 0);
  const recommendedAmount = monthlyExpenseAverage * Number(settings?.target_months ?? 6);

  return {
    current_amount: currentAmount,
    linked_goal: linkedGoal,
    monthly_expense_average: monthlyExpenseAverage,
    months_covered: monthlyExpenseAverage > 0 ? currentAmount / monthlyExpenseAverage : 0,
    progress_percent: percent(currentAmount, recommendedAmount),
    recommended_amount: recommendedAmount,
    settings: settings as EmergencyReserveSettings | null,
  };
}

export async function listPlanningData(userId: string): Promise<PlanningDataBundle> {
  const [
    { data: accounts, error: accountsError },
    { data: goals, error: goalsError },
    { data: goalMovements, error: goalMovementsError },
    { data: debts, error: debtsError },
    { data: debtPayments, error: debtPaymentsError },
  ] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("goal_movements").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("debts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("debt_payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  assertNoError(accountsError);
  assertNoError(goalsError);
  assertNoError(goalMovementsError);
  assertNoError(debtsError);
  assertNoError(debtPaymentsError);

  const safeGoals = goals ?? [];
  const safeGoalMovements = goalMovements ?? [];
  const safeDebts = debts ?? [];
  const safeDebtPayments = debtPayments ?? [];

  return {
    accounts: accounts ?? [],
    debts: safeDebts.map((debt) =>
      buildDebtSummary(
        debt,
        safeDebtPayments.filter((payment) => payment.debt_id === debt.id),
      ),
    ),
    emergencyReserve: await getEmergencyReserveSummary(userId, safeGoals),
    goals: safeGoals.map((goal) =>
      buildGoalSummary(
        goal,
        safeGoalMovements.filter((movement) => movement.goal_id === goal.id),
      ),
    ),
  };
}

export async function createGoal(userId: string, input: GoalInput) {
  const { error } = await supabase.from("goals").insert({
    ...input,
    color: input.color || null,
    icon: input.icon || null,
    target_date: input.target_date || null,
    user_id: userId,
  });
  assertNoError(error);
}

export async function updateGoal(userId: string, goalId: string, input: GoalInput) {
  const { error } = await supabase
    .from("goals")
    .update({
      ...input,
      color: input.color || null,
      icon: input.icon || null,
      target_date: input.target_date || null,
    })
    .eq("id", goalId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function deleteGoal(userId: string, goalId: string) {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function createGoalMovement(userId: string, input: GoalMovementInput) {
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("id", input.goal_id)
    .eq("user_id", userId)
    .single();
  assertNoError(goalError);

  const transactionType = input.type === "deposit" ? "expense" : "income";
  const title = `${input.type === "deposit" ? "Aporte em" : "Retirada de"} meta: ${goal?.name ?? ""}`;
  let transactionId: string | null = null;

  if (input.account_id) {
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        account_id: input.account_id,
        amount: input.amount,
        category_id: null,
        notes: input.notes || null,
        payment_method: "goal_movement",
        title,
        transaction_date: input.movement_date,
        type: transactionType,
        user_id: userId,
      })
      .select("*")
      .single();
    assertNoError(transactionError);
    transactionId = transaction?.id ?? null;
  }

  const nextAmount =
    Number(goal?.current_amount ?? 0) +
    (input.type === "deposit" ? input.amount : -input.amount);

  const { error: updateError } = await supabase
    .from("goals")
    .update({ current_amount: Math.max(nextAmount, 0) })
    .eq("id", input.goal_id)
    .eq("user_id", userId);
  assertNoError(updateError);

  const { error } = await supabase.from("goal_movements").insert({
    ...input,
    account_id: input.account_id || null,
    notes: input.notes || null,
    transaction_id: transactionId,
    user_id: userId,
  });
  assertNoError(error);
}

export async function createDebt(userId: string, input: DebtInput) {
  const { error } = await supabase.from("debts").insert({
    ...input,
    creditor: input.creditor || null,
    user_id: userId,
  });
  assertNoError(error);
}

export async function updateDebt(userId: string, debtId: string, input: DebtInput) {
  const { error } = await supabase
    .from("debts")
    .update({ ...input, creditor: input.creditor || null })
    .eq("id", debtId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function deleteDebt(userId: string, debtId: string) {
  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", debtId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function createDebtPayment(userId: string, input: DebtPaymentInput) {
  const { data: debt, error: debtError } = await supabase
    .from("debts")
    .select("*")
    .eq("id", input.debt_id)
    .eq("user_id", userId)
    .single();
  assertNoError(debtError);

  const paymentAmount = Math.min(input.amount, Number(debt?.remaining_balance ?? input.amount));

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      account_id: input.account_id,
      amount: paymentAmount,
      category_id: null,
      notes: input.notes || null,
      payment_method: "debt_payment",
      title: `Pagamento dívida: ${debt?.name ?? ""}`,
      transaction_date: input.payment_date,
      type: "expense",
      user_id: userId,
    })
    .select("*")
    .single();
  assertNoError(transactionError);

  const nextBalance = Math.max(Number(debt?.remaining_balance ?? 0) - paymentAmount, 0);
  const { error: updateError } = await supabase
    .from("debts")
    .update({ remaining_balance: nextBalance })
    .eq("id", input.debt_id)
    .eq("user_id", userId);
  assertNoError(updateError);

  const { error } = await supabase.from("debt_payments").insert({
    ...input,
    amount: paymentAmount,
    notes: input.notes || null,
    transaction_id: transaction?.id ?? null,
    user_id: userId,
  });
  assertNoError(error);
}

export async function updateEmergencyReserveSettings(
  userId: string,
  input: EmergencyReserveInput,
) {
  const settings = await ensureEmergencySettings(userId);
  if (!settings) {
    throw new Error("Não foi possível carregar a reserva de emergência.");
  }
  const { error } = await supabase
    .from("emergency_reserve_settings")
    .update({
      linked_goal_id: input.linked_goal_id || null,
      target_months: input.target_months,
    })
    .eq("id", settings.id)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function getPlanningDashboardSummary(
  userId: string,
): Promise<PlanningDashboardSummary> {
  const data = await listPlanningData(userId);
  const totalDebt = data.debts.reduce(
    (sum, debt) => sum + Number(debt.remaining_balance),
    0,
  );

  return {
    debt_alerts: data.debts
      .filter((debt) => debt.high_interest)
      .map((debt) => ({
        description: `${debt.name} tem juros de ${Number(debt.monthly_interest_rate).toFixed(2)}% ao mês.`,
        title: "Dívida com juros altos",
      })),
    emergency_reserve: data.emergencyReserve,
    top_goals: data.goals.slice(0, 3),
    total_debt: totalDebt,
  };
}
