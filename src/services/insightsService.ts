import { getTodayValue } from "../lib/dates";
import { buildBalanceForecast, buildReportSummary } from "../lib/insightRules";
import { supabase } from "../lib/supabase/client";
import type {
  Account,
  Category,
  FinancialReminder,
  RecurringTransaction,
  Transaction,
} from "../types/database";
import type { TransactionWithRelations } from "../types/finance";
import type {
  FinancialReminderInput,
  FinancialReportData,
  PlanningInsightsData,
  RecurringOccurrenceWithRelations,
  RecurringTransactionInput,
  RecurringTransactionWithRelations,
} from "../types/insights";
import { listAccounts, listCategories } from "./financeService";

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

function attachRecurringRelations(
  items: RecurringTransaction[],
  accounts: Account[],
  categories: Category[],
): RecurringTransactionWithRelations[] {
  return items.map((item) => ({
    ...item,
    account: accounts.find((account) => account.id === item.account_id) ?? null,
    category: categories.find((category) => category.id === item.category_id) ?? null,
  }));
}

function attachTransactionRelations(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
): TransactionWithRelations[] {
  return transactions.map((transaction) => ({
    ...transaction,
    account: accounts.find((account) => account.id === transaction.account_id) ?? null,
    category:
      categories.find((category) => category.id === transaction.category_id) ?? null,
  }));
}

export async function processDueRecurringTransactions() {
  const { data, error } = await supabase.rpc("process_due_recurring_transactions", {
    p_until_date: getTodayValue(),
  });
  assertNoError(error);
  return Number(data ?? 0);
}

export async function listPlanningInsights(
  userId: string,
): Promise<PlanningInsightsData> {
  await processDueRecurringTransactions();

  const [
    accounts,
    categories,
    { data: recurringTransactions, error: recurringError },
    { data: occurrences, error: occurrenceError },
    { data: reminders, error: reminderError },
  ] = await Promise.all([
    listAccounts(userId),
    listCategories(userId),
    supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("is_active", { ascending: false })
      .order("next_due_date"),
    supabase
      .from("recurring_transaction_occurrences")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: false })
      .limit(40),
    supabase
      .from("financial_reminders")
      .select("*")
      .eq("user_id", userId)
      .order("due_date"),
  ]);

  [recurringError, occurrenceError, reminderError].forEach(assertNoError);

  const safeRecurring = recurringTransactions ?? [];
  const safeOccurrences = occurrences ?? [];
  const occurrenceTransactionIds = safeOccurrences.map((item) => item.transaction_id);
  let occurrenceTransactions: Transaction[] = [];

  if (occurrenceTransactionIds.length > 0) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .in("id", occurrenceTransactionIds);
    assertNoError(error);
    occurrenceTransactions = data ?? [];
  }

  const occurrencesWithRelations: RecurringOccurrenceWithRelations[] =
    safeOccurrences.map((occurrence) => ({
      ...occurrence,
      recurring:
        safeRecurring.find(
          (item) => item.id === occurrence.recurring_transaction_id,
        ) ?? null,
      transaction:
        occurrenceTransactions.find(
          (transaction) => transaction.id === occurrence.transaction_id,
        ) ?? null,
    }));
  const currentBalance = accounts.reduce(
    (sum, account) => sum + account.current_balance,
    0,
  );

  return {
    accounts,
    categories,
    forecast: buildBalanceForecast(
      currentBalance,
      safeRecurring,
      getTodayValue(),
      90,
    ),
    occurrences: occurrencesWithRelations,
    recurringTransactions: attachRecurringRelations(
      safeRecurring,
      accounts,
      categories,
    ),
    reminders: (reminders ?? []).sort((left, right) => {
      if (left.status === "pending" && right.status !== "pending") return -1;
      if (left.status !== "pending" && right.status === "pending") return 1;
      return left.due_date.localeCompare(right.due_date);
    }),
  };
}

export async function createRecurringTransaction(
  userId: string,
  input: RecurringTransactionInput,
) {
  const { error } = await supabase.from("recurring_transactions").insert({
    ...input,
    category_id: input.category_id || null,
    end_date: input.end_date || null,
    notes: input.notes || null,
    payment_method: input.payment_method || null,
    title: input.title.trim(),
    user_id: userId,
  });
  assertNoError(error);
}

export async function updateRecurringTransaction(
  userId: string,
  recurringId: string,
  input: RecurringTransactionInput,
) {
  const { error } = await supabase
    .from("recurring_transactions")
    .update({
      ...input,
      category_id: input.category_id || null,
      end_date: input.end_date || null,
      notes: input.notes || null,
      payment_method: input.payment_method || null,
      title: input.title.trim(),
    })
    .eq("id", recurringId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function toggleRecurringTransaction(
  userId: string,
  recurringId: string,
  isActive: boolean,
) {
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: isActive })
    .eq("id", recurringId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function deleteRecurringTransaction(recurringId: string) {
  const { error } = await supabase.rpc("delete_recurring_transaction_safely", {
    p_recurring_transaction_id: recurringId,
  });
  assertNoError(error);
}

export async function reverseRecurringOccurrence(occurrenceId: string) {
  const { error } = await supabase.rpc(
    "reverse_recurring_transaction_occurrence",
    { p_occurrence_id: occurrenceId },
  );
  assertNoError(error);
}

export async function createFinancialReminder(
  userId: string,
  input: FinancialReminderInput,
) {
  const { error } = await supabase.from("financial_reminders").insert({
    amount: input.amount || null,
    due_date: input.due_date,
    kind: input.kind,
    notes: input.notes || null,
    title: input.title.trim(),
    user_id: userId,
  });
  assertNoError(error);
}

export async function updateFinancialReminderStatus(
  userId: string,
  reminderId: string,
  status: FinancialReminder["status"],
) {
  const { error } = await supabase
    .from("financial_reminders")
    .update({
      completed_at: status === "completed" ? new Date().toISOString() : null,
      status,
    })
    .eq("id", reminderId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function deleteFinancialReminder(
  userId: string,
  reminderId: string,
) {
  const { error } = await supabase
    .from("financial_reminders")
    .delete()
    .eq("id", reminderId)
    .eq("user_id", userId);
  assertNoError(error);
}

export async function getFinancialReport(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<FinancialReportData> {
  const [
    { data: transactions, error: transactionsError },
    { data: accounts, error: accountsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId),
  ]);

  [transactionsError, accountsError, categoriesError].forEach(assertNoError);
  const safeTransactions = transactions ?? [];
  const safeAccounts = accounts ?? [];
  const safeCategories = categories ?? [];
  const summary = buildReportSummary(
    safeTransactions,
    safeCategories,
    startDate,
    endDate,
  );

  return {
    accounts: safeAccounts,
    categories: safeCategories,
    endDate,
    startDate,
    transactions: attachTransactionRelations(
      safeTransactions,
      safeAccounts,
      safeCategories,
    ),
    ...summary,
  };
}
