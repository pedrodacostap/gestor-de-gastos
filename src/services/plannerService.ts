import {
  getCurrentMonthValue,
  getInvoiceDueDate,
  getMonthRange,
} from "../lib/dates";
import { getNextSubscriptionChargeDate } from "../lib/subscriptionRules";
import { supabase } from "../lib/supabase/client";
import type {
  Budget,
  Category,
  CreditCard,
  CreditCardInstallment,
  Debt,
  Goal,
  Subscription,
  SubscriptionCharge,
  Transaction,
} from "../types/database";
import type {
  BudgetInput,
  BudgetWithUsage,
  CalendarEvent,
  PlannerData,
  SubscriptionInput,
  SubscriptionWithSummary,
} from "../types/planner";

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

function monthDate(month: string) {
  return `${month}-01`;
}

function normalizeMonth(date: string) {
  return date.slice(0, 7);
}

function attachSubscriptionSummary(
  subscriptions: Subscription[],
  categories: Category[],
  charges: SubscriptionCharge[],
): SubscriptionWithSummary[] {
  const today = new Date();

  return subscriptions.map((subscription) => {
    const lastChargeDate = charges
      .filter((charge) => charge.subscription_id === subscription.id)
      .map((charge) => charge.charge_date)
      .sort()
      .at(-1);
    const nextDate = getNextSubscriptionChargeDate(subscription, lastChargeDate);
    const diffDays = Math.ceil(
      (new Date(`${nextDate}T00:00:00`).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      ...subscription,
      category:
        categories.find((category) => category.id === subscription.category_id) ?? null,
      next_charge_date: nextDate,
      renewal_alert: subscription.is_active && diffDays >= 0 && diffDays <= 7,
    };
  });
}

function buildBudgetUsage(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
): BudgetWithUsage[] {
  return budgets.map((budget) => {
    const used = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category_id === budget.category_id &&
          transaction.transaction_date.startsWith(normalizeMonth(budget.month)),
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const amount = Number(budget.amount);
    const percent = amount > 0 ? (used / amount) * 100 : 0;
    const status =
      percent > 100
        ? "exceeded"
        : percent >= 100
          ? "reached"
          : percent >= 80
            ? "warning"
            : "ok";

    return {
      ...budget,
      category: categories.find((category) => category.id === budget.category_id) ?? null,
      percent,
      remaining: amount - used,
      status,
      used,
    };
  });
}

function buildCalendarEvents(args: {
  cards: CreditCard[];
  debts: Debt[];
  goals: Goal[];
  installments: CreditCardInstallment[];
  month: string;
  subscriptions: SubscriptionWithSummary[];
  transactions: Transaction[];
}) {
  return [
    ...args.transactions.map<CalendarEvent>((transaction) => ({
      amount: Number(transaction.amount),
      date: transaction.transaction_date,
      id: transaction.id,
      kind: transaction.type,
      title: transaction.title,
    })),
    ...args.installments.map<CalendarEvent>((installment) => ({
      amount: Number(installment.amount),
      date: installment.competence_month,
      id: installment.id,
      kind: "installment",
      title: `Parcela ${installment.installment_number}`,
    })),
    ...args.cards.map<CalendarEvent>((card) => ({
      date: getInvoiceDueDate(args.month, card.due_day),
      id: card.id,
      kind: "invoice",
      title: `Fatura ${card.name}`,
    })),
    ...args.goals
      .filter((goal) => goal.target_date)
      .map<CalendarEvent>((goal) => ({
        amount: Number(goal.target_amount),
        date: goal.target_date ?? "",
        id: goal.id,
        kind: "goal",
        title: goal.name,
      })),
    ...args.debts.map<CalendarEvent>((debt) => ({
      amount: Number(debt.installment_amount),
      date: getInvoiceDueDate(args.month, debt.due_day),
      id: debt.id,
      kind: "debt",
      title: debt.name,
    })),
    ...args.subscriptions.map<CalendarEvent>((subscription) => ({
      amount: Number(subscription.amount),
      date: subscription.next_charge_date,
      id: subscription.id,
      kind: "subscription",
      title: subscription.name,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

export async function listPlannerData(
  userId: string,
  month = getCurrentMonthValue(),
): Promise<PlannerData> {
  const { startDate, endDate } = getMonthRange(month);
  const [
    { data: accounts, error: accountsError },
    { data: categories, error: categoriesError },
    { data: transactions, error: transactionsError },
    { data: subscriptions, error: subscriptionsError },
    { data: charges, error: chargesError },
    { data: budgets, error: budgetsError },
    { data: installments, error: installmentsError },
    { data: cards, error: cardsError },
    { data: goals, error: goalsError },
    { data: debts, error: debtsError },
  ] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate),
    supabase.from("subscriptions").select("*").eq("user_id", userId).order("name"),
    supabase.from("subscription_charges").select("*").eq("user_id", userId),
    supabase.from("budgets").select("*").eq("user_id", userId).eq("month", monthDate(month)),
    supabase.from("credit_card_installments").select("*").eq("user_id", userId),
    supabase.from("credit_cards").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("debts").select("*").eq("user_id", userId),
  ]);

  [
    accountsError,
    categoriesError,
    transactionsError,
    subscriptionsError,
    chargesError,
    budgetsError,
    installmentsError,
    cardsError,
    goalsError,
    debtsError,
  ].forEach(assertNoError);

  const safeCategories = categories ?? [];
  const safeTransactions = transactions ?? [];
  const safeSubscriptionCharges: SubscriptionCharge[] = charges ?? [];
  const safeSubscriptions = attachSubscriptionSummary(
    subscriptions ?? [],
    safeCategories,
    safeSubscriptionCharges,
  );
  const budgetsWithUsage = buildBudgetUsage(
    budgets ?? [],
    safeCategories,
    safeTransactions,
  );
  const budgetTotal = budgetsWithUsage.reduce((sum, budget) => sum + Number(budget.amount), 0);
  const budgetUsed = budgetsWithUsage.reduce((sum, budget) => sum + budget.used, 0);
  const events = buildCalendarEvents({
    cards: cards ?? [],
    debts: debts ?? [],
    goals: goals ?? [],
    installments: installments ?? [],
    month,
    subscriptions: safeSubscriptions,
    transactions: safeTransactions,
  });

  return {
    accounts: accounts ?? [],
    budgetSummary: {
      percent: budgetTotal > 0 ? (budgetUsed / budgetTotal) * 100 : 0,
      remaining: budgetTotal - budgetUsed,
      total: budgetTotal,
      used: budgetUsed,
    },
    budgets: budgetsWithUsage,
    calendarEvents: events,
    categories: safeCategories,
    nextCharges: safeSubscriptions
      .filter((subscription) => subscription.is_active)
      .sort((a, b) => a.next_charge_date.localeCompare(b.next_charge_date))
      .slice(0, 5),
    nextDueEvents: events.filter((event) => event.date >= startDate).slice(0, 6),
    subscriptionCharges: safeSubscriptionCharges,
    subscriptions: safeSubscriptions,
  };
}

export async function createSubscription(userId: string, input: SubscriptionInput) {
  const { error } = await supabase.from("subscriptions").insert({
    ...input,
    account_id: input.account_id || null,
    category_id: input.category_id || null,
    user_id: userId,
  });
  assertNoError(error);
}

export async function updateSubscription(
  userId: string,
  id: string,
  input: SubscriptionInput,
) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      ...input,
      account_id: input.account_id || null,
      category_id: input.category_id || null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function cancelSubscription(userId: string, id: string) {
  const { error } = await supabase
    .from("subscriptions")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function createSubscriptionCharge(
  userId: string,
  subscription: SubscriptionWithSummary,
) {
  if (!userId) throw new Error("Usuário não autenticado.");
  const { error } = await supabase.rpc("create_subscription_charge", {
    p_charge_date: subscription.next_charge_date,
    p_subscription_id: subscription.id,
  });
  assertNoError(error);
}

export async function reverseSubscriptionCharge(userId: string, chargeId: string) {
  if (!userId) throw new Error("Usuário não autenticado.");
  const { error } = await supabase.rpc("reverse_subscription_charge", {
    p_charge_id: chargeId,
  });
  assertNoError(error);
}

export async function createBudget(userId: string, input: BudgetInput) {
  const { error } = await supabase.from("budgets").upsert(
    {
      amount: input.amount,
      category_id: input.category_id,
      month: monthDate(input.month),
      user_id: userId,
    },
    { onConflict: "user_id,category_id,month" },
  );
  assertNoError(error);
}

export async function deleteBudget(userId: string, id: string) {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  assertNoError(error);
}
