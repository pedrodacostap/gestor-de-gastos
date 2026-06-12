import {
  getMonthLabel,
  getMonthRange,
  getRecentMonths,
} from "../lib/dates";
import { supabase } from "../lib/supabase/client";
import type { Account, Category, Transaction } from "../types/database";
import type {
  AccountInput,
  AccountWithBalance,
  CategoryInput,
  DashboardData,
  TransactionFilters,
  TransactionInput,
  TransactionWithRelations,
} from "../types/finance";

function assertNoError(error: unknown) {
  if (!error) {
    return;
  }

  if (error instanceof Error) {
    throw error;
  }

  if (typeof error === "object" && "message" in error) {
    throw new Error(String(error.message));
  }

  throw new Error("Não foi possível concluir a operação.");
}

function calculateAccountBalance(account: Account, transactions: Transaction[]) {
  return transactions.reduce((balance, transaction) => {
    return transaction.type === "income"
      ? balance + Number(transaction.amount)
      : balance - Number(transaction.amount);
  }, Number(account.initial_balance));
}

function attachRelations(
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

export async function listAccounts(userId: string): Promise<AccountWithBalance[]> {
  const [{ data: accounts, error: accountsError }, { data: transactions, error }] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").eq("user_id", userId),
    ]);

  assertNoError(accountsError);
  assertNoError(error);

  return (accounts ?? []).map((account) => {
    const accountTransactions = (transactions ?? []).filter(
      (transaction) => transaction.account_id === account.id,
    );

    return {
      ...account,
      current_balance: calculateAccountBalance(account, accountTransactions),
      transaction_count: accountTransactions.length,
    };
  });
}

export async function createAccount(userId: string, input: AccountInput) {
  const { error } = await supabase.from("accounts").insert({
    ...input,
    bank: input.bank || null,
    color: input.color || null,
    user_id: userId,
  });

  assertNoError(error);
}

export async function updateAccount(accountId: string, input: AccountInput) {
  const { error } = await supabase
    .from("accounts")
    .update({
      ...input,
      bank: input.bank || null,
      color: input.color || null,
    })
    .eq("id", accountId);

  assertNoError(error);
}

export async function deleteAccount(accountId: string) {
  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId);

  assertNoError(countError);

  if ((count ?? 0) > 0) {
    throw new Error("Exclua ou mova as transações antes de remover esta conta.");
  }

  const { error } = await supabase.from("accounts").delete().eq("id", accountId);
  assertNoError(error);
}

export async function listCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("type")
    .order("name");

  assertNoError(error);
  return data ?? [];
}

export async function createCategory(userId: string, input: CategoryInput) {
  const { error } = await supabase.from("categories").insert({
    ...input,
    color: input.color || null,
    icon: input.icon || null,
    user_id: userId,
  });

  assertNoError(error);
}

export async function listTransactions(
  userId: string,
  filters: TransactionFilters,
): Promise<TransactionWithRelations[]> {
  const { startDate, endDate } = getMonthRange(filters.month);
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.query?.trim()) {
    query = query.ilike("title", `%${filters.query.trim()}%`);
  }

  const [
    { data: transactions, error },
    { data: accounts, error: accountsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    query,
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId),
  ]);

  assertNoError(error);
  assertNoError(accountsError);
  assertNoError(categoriesError);

  return attachRelations(transactions ?? [], accounts ?? [], categories ?? []);
}

export async function createTransaction(userId: string, input: TransactionInput) {
  const { error } = await supabase.from("transactions").insert({
    ...input,
    category_id: input.category_id || null,
    notes: input.notes || null,
    payment_method: input.payment_method || null,
    user_id: userId,
  });

  assertNoError(error);
}

export async function updateTransaction(
  transactionId: string,
  input: TransactionInput,
) {
  const { error } = await supabase
    .from("transactions")
    .update({
      ...input,
      category_id: input.category_id || null,
      notes: input.notes || null,
      payment_method: input.payment_method || null,
    })
    .eq("id", transactionId);

  assertNoError(error);
}

export async function deleteTransaction(transactionId: string) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  assertNoError(error);
}

export async function duplicateTransaction(userId: string, transaction: Transaction) {
  await createTransaction(userId, {
    account_id: transaction.account_id,
    amount: Number(transaction.amount),
    category_id: transaction.category_id,
    notes: transaction.notes,
    payment_method: transaction.payment_method,
    title: `${transaction.title} (cópia)`,
    transaction_date: transaction.transaction_date,
    type: transaction.type,
  });
}

export async function getDashboardData(
  userId: string,
  month: string,
): Promise<DashboardData> {
  const { startDate, endDate } = getMonthRange(month);
  const recentMonths = getRecentMonths(month, 6);
  const { startDate: evolutionStartDate } = getMonthRange(recentMonths[0]);

  const [
    { data: accounts, error: accountsError },
    { data: allTransactions, error: allTransactionsError },
    { data: monthTransactions, error: monthTransactionsError },
    { data: evolutionTransactions, error: evolutionError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("transaction_date", evolutionStartDate)
      .lte("transaction_date", endDate),
    supabase.from("categories").select("*").eq("user_id", userId),
  ]);

  assertNoError(accountsError);
  assertNoError(allTransactionsError);
  assertNoError(monthTransactionsError);
  assertNoError(evolutionError);
  assertNoError(categoriesError);

  const safeAccounts = accounts ?? [];
  const safeCategories = categories ?? [];
  const safeAllTransactions = allTransactions ?? [];
  const safeMonthTransactions = monthTransactions ?? [];
  const safeEvolutionTransactions = evolutionTransactions ?? [];

  const balanceTotal = safeAccounts.reduce(
    (total, account) =>
      total +
      calculateAccountBalance(
        account,
        safeAllTransactions.filter(
          (transaction) => transaction.account_id === account.id,
        ),
      ),
    0,
  );

  const incomeMonth = safeMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const expensesMonth = safeMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const monthResult = incomeMonth - expensesMonth;
  const savingsRate = incomeMonth > 0 ? (monthResult / incomeMonth) * 100 : 0;

  const groupedExpenses = safeMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((groups, transaction) => {
      const key = transaction.category_id ?? "sem-categoria";
      groups[key] = (groups[key] ?? 0) + Number(transaction.amount);
      return groups;
    }, {});

  const categoryExpenses = Object.entries(groupedExpenses)
    .map(([categoryId, total]) => {
      const category = safeCategories.find((item) => item.id === categoryId);

      return {
        color: category?.color ?? null,
        name: category?.name ?? "Sem categoria",
        percent: expensesMonth > 0 ? (total / expensesMonth) * 100 : 0,
        total,
      };
    })
    .sort((a, b) => b.total - a.total);

  const monthlyEvolution = recentMonths.map((monthItem) => {
    const monthTransactions = safeEvolutionTransactions.filter((transaction) =>
      transaction.transaction_date.startsWith(monthItem),
    );

    return {
      expenses: monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + Number(transaction.amount), 0),
      income: monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + Number(transaction.amount), 0),
      label: getMonthLabel(monthItem),
      month: monthItem,
    };
  });

  const largestExpenses = attachRelations(
    safeMonthTransactions
      .filter((transaction) => transaction.type === "expense")
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5),
    safeAccounts,
    safeCategories,
  );

  const alerts: DashboardData["alerts"] = [];

  if (monthResult < 0) {
    alerts.push({
      description: "As despesas do mês estão maiores que as receitas.",
      title: "Mês negativo",
      tone: "danger",
    });
  }

  if (safeAccounts.length === 0) {
    alerts.push({
      description: "Cadastre uma conta para acompanhar saldo e transações.",
      title: "Nenhuma conta cadastrada",
      tone: "info",
    });
  }

  if (safeMonthTransactions.length === 0) {
    alerts.push({
      description: "Registre receitas ou despesas para gerar análises mensais.",
      title: "Nenhuma transação no mês",
      tone: "info",
    });
  }

  const highestCategory = categoryExpenses[0];
  if (highestCategory && highestCategory.percent >= 50 && expensesMonth > 0) {
    alerts.push({
      description: `${highestCategory.name} representa ${Math.round(
        highestCategory.percent,
      )}% das despesas do mês.`,
      title: "Categoria com gasto alto",
      tone: "warning",
    });
  }

  if (balanceTotal < 0) {
    alerts.push({
      description: "O saldo consolidado das contas está abaixo de zero.",
      title: "Saldo total negativo",
      tone: "danger",
    });
  }

  return {
    accountCount: safeAccounts.length,
    alerts,
    balanceTotal,
    categoryExpenses,
    expensesMonth,
    incomeMonth,
    largestExpenses,
    monthlyEvolution,
    monthResult,
    recentTransactions: attachRelations(
      safeMonthTransactions.slice(0, 6),
      safeAccounts,
      safeCategories,
    ),
    savingsRate,
    transactionCountMonth: safeMonthTransactions.length,
  };
}
