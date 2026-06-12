import {
  Copy,
  Edit2,
  Plus,
  ReceiptText,
  Tags,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";
import { getCurrentMonthValue, getTodayValue } from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import {
  createCategory,
  createTransaction,
  deleteTransaction,
  duplicateTransaction,
  listAccounts,
  listCategories,
  listTransactions,
  updateTransaction,
} from "../services/financeService";
import { useAuth } from "../context/auth/useAuth";
import type { Category, TransactionType } from "../types/database";
import type {
  AccountWithBalance,
  CategoryInput,
  TransactionInput,
  TransactionWithRelations,
} from "../types/finance";

const transactionTypes = [
  { label: "Todos", value: "all" },
  { label: "Receitas", value: "income" },
  { label: "Despesas", value: "expense" },
];

const paymentMethods = [
  { label: "Pix", value: "pix" },
  { label: "Débito", value: "debit" },
  { label: "Dinheiro", value: "cash" },
  { label: "Transferência", value: "transfer" },
];

const colors = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff375f"];

function createEmptyTransaction(accountId = ""): TransactionInput {
  return {
    account_id: accountId,
    amount: 0,
    category_id: "",
    notes: "",
    payment_method: "pix",
    title: "",
    transaction_date: getTodayValue(),
    type: "expense",
  };
}

const emptyCategory: CategoryInput = {
  color: colors[0],
  icon: "tag",
  name: "",
  type: "expense",
};

export function TransactionsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithRelations | null>(null);
  const [transactionForm, setTransactionForm] = useState<TransactionInput>(
    createEmptyTransaction(),
  );
  const [categoryForm, setCategoryForm] = useState<CategoryInput>(emptyCategory);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [type, setType] = useState<"all" | TransactionType>("all");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) => category.type === transactionForm.type),
    [categories, transactionForm.type],
  );

  const loadBaseData = useCallback(async () => {
    if (!user) {
      return;
    }

    const [loadedAccounts, loadedCategories] = await Promise.all([
      listAccounts(user.id),
      listCategories(user.id),
    ]);

    setAccounts(loadedAccounts);
    setCategories(loadedCategories);

    if (loadedAccounts[0]) {
      setTransactionForm((current) => ({
        ...current,
        account_id: current.account_id || loadedAccounts[0].id,
      }));
    }
  }, [user]);

  const loadTransactions = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      await loadBaseData();
      setTransactions(
        await listTransactions(user.id, {
          accountId,
          categoryId,
          month,
          query,
          type,
        }),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }, [accountId, categoryId, loadBaseData, month, query, type, user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadTransactions();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadTransactions]);

  function openCreateTransaction() {
    setEditingTransaction(null);
    setTransactionForm(createEmptyTransaction(accounts[0]?.id ?? ""));
    setIsTransactionModalOpen(true);
  }

  function openEditTransaction(transaction: TransactionWithRelations) {
    setEditingTransaction(transaction);
    setTransactionForm({
      account_id: transaction.account_id,
      amount: Number(transaction.amount),
      category_id: transaction.category_id ?? "",
      notes: transaction.notes ?? "",
      payment_method: transaction.payment_method ?? "pix",
      title: transaction.title,
      transaction_date: transaction.transaction_date,
      type: transaction.type,
    });
    setIsTransactionModalOpen(true);
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionForm);
      } else {
        await createTransaction(user.id, transactionForm);
      }

      setIsTransactionModalOpen(false);
      await loadTransactions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar transação.");
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      await createCategory(user.id, categoryForm);
      setCategoryForm(emptyCategory);
      setIsCategoryModalOpen(false);
      await loadTransactions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar categoria.");
    }
  }

  async function handleDuplicate(transaction: TransactionWithRelations) {
    if (!user) {
      return;
    }

    try {
      await duplicateTransaction(user.id, transaction);
      await loadTransactions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao duplicar transação.");
    }
  }

  async function handleDelete(transactionId: string) {
    try {
      await deleteTransaction(transactionId);
      await loadTransactions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao excluir transação.");
    }
  }

  return (
    <PageFrame
      actions={
        <>
          <Button onClick={() => setIsCategoryModalOpen(true)} variant="secondary">
            Nova categoria
          </Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreateTransaction}>
            Nova transação
          </Button>
        </>
      }
      description="Registre receitas e despesas com filtros por mês, tipo, conta, categoria e busca por texto."
      title="Transações"
    >
      {message && (
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          {message}
        </p>
      )}

      <Card tone="elevated">
        <div className="grid gap-4 md:grid-cols-5">
          <Input
            label="Mês"
            onChange={(event) => setMonth(event.target.value)}
            type="month"
            value={month}
          />
          <Select
            label="Tipo"
            onChange={(event) => setType(event.target.value as "all" | TransactionType)}
            options={transactionTypes}
            value={type}
          />
          <Select
            label="Conta"
            onChange={(event) => setAccountId(event.target.value)}
            options={[
              { label: "Todas", value: "" },
              ...accounts.map((account) => ({ label: account.name, value: account.id })),
            ]}
            value={accountId}
          />
          <Select
            label="Categoria"
            onChange={(event) => setCategoryId(event.target.value)}
            options={[
              { label: "Todas", value: "" },
              ...categories.map((category) => ({
                label: category.name,
                value: category.id,
              })),
            ]}
            value={categoryId}
          />
          <Input
            label="Buscar"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mercado, salário..."
            value={query}
          />
        </div>
      </Card>

      {transactions.length === 0 && !isLoading ? (
        <EmptyState
          action={<Button onClick={openCreateTransaction}>Criar transação</Button>}
          description="Quando houver receitas ou despesas no período, elas aparecerão aqui com filtros e ações rápidas."
          icon={<ReceiptText className="h-6 w-6" />}
          title="Nenhuma transação encontrada"
        />
      ) : (
        <section className="grid gap-3">
          {transactions.map((transaction) => (
            <Card className="p-4" key={transaction.id} tone="elevated">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={transaction.type === "income" ? "green" : "pink"}>
                      {transaction.type === "income" ? "Receita" : "Despesa"}
                    </Badge>
                    <span className="text-sm text-zinc-400">
                      {formatDate(transaction.transaction_date)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    {transaction.title}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {transaction.account?.name ?? "Conta"} ·{" "}
                    {transaction.category?.name ?? "Sem categoria"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p
                    className={`text-xl font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                  <div className="flex gap-1">
                    <Button aria-label="Editar" onClick={() => openEditTransaction(transaction)} size="sm" variant="ghost">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button aria-label="Duplicar" onClick={() => handleDuplicate(transaction)} size="sm" variant="ghost">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button aria-label="Excluir" onClick={() => handleDelete(transaction.id)} size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Card tone="elevated">
        <div className="mb-4 flex items-center gap-3">
          <Tags className="h-5 w-5 text-sky-300" />
          <h2 className="text-lg font-semibold text-white">Categorias</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(["income", "expense"] as TransactionType[]).map((categoryType) => (
            <div key={categoryType}>
              <p className="mb-3 text-sm font-medium text-zinc-400">
                {categoryType === "income" ? "Receitas" : "Despesas"}
              </p>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((category) => category.type === categoryType)
                  .map((category) => (
                    <Badge key={category.id} tone={categoryType === "income" ? "green" : "orange"}>
                      {category.name}
                    </Badge>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={editingTransaction ? "Editar transação" : "Nova transação"}
      >
        <form className="space-y-4" onSubmit={handleTransactionSubmit}>
          <Select
            label="Tipo"
            onChange={(event) =>
              setTransactionForm((current) => ({
                ...current,
                category_id: "",
                type: event.target.value as TransactionType,
              }))
            }
            options={[
              { label: "Despesa", value: "expense" },
              { label: "Receita", value: "income" },
            ]}
            value={transactionForm.type}
          />
          <Input
            label="Título"
            onChange={(event) =>
              setTransactionForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Mercado, salário, aluguel..."
            required
            value={transactionForm.title}
          />
          <Input
            label="Valor"
            min="0"
            onChange={(event) =>
              setTransactionForm((current) => ({
                ...current,
                amount: Number(event.target.value),
              }))
            }
            required
            step="0.01"
            type="number"
            value={transactionForm.amount}
          />
          <Select
            label="Conta"
            onChange={(event) =>
              setTransactionForm((current) => ({
                ...current,
                account_id: event.target.value,
              }))
            }
            options={accounts.map((account) => ({ label: account.name, value: account.id }))}
            value={transactionForm.account_id}
          />
          <Select
            label="Categoria"
            onChange={(event) =>
              setTransactionForm((current) => ({
                ...current,
                category_id: event.target.value,
              }))
            }
            options={[
              { label: "Sem categoria", value: "" },
              ...filteredCategories.map((category) => ({
                label: category.name,
                value: category.id,
              })),
            ]}
            value={transactionForm.category_id ?? ""}
          />
          <Select
            label="Pagamento"
            onChange={(event) =>
              setTransactionForm((current) => ({
                ...current,
                payment_method: event.target.value,
              }))
            }
            options={paymentMethods}
            value={transactionForm.payment_method ?? "pix"}
          />
          <Input
            label="Data"
            onChange={(event) =>
              setTransactionForm((current) => ({
                ...current,
                transaction_date: event.target.value,
              }))
            }
            required
            type="date"
            value={transactionForm.transaction_date}
          />
          <textarea
            className="min-h-24 w-full rounded-lg border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20"
            onChange={(event) =>
              setTransactionForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            placeholder="Observações"
            value={transactionForm.notes ?? ""}
          />
          <Button disabled={accounts.length === 0} isFullWidth type="submit">
            Salvar transação
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nova categoria"
      >
        <form className="space-y-4" onSubmit={handleCategorySubmit}>
          <Input
            label="Nome"
            onChange={(event) =>
              setCategoryForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Mercado, bônus, academia..."
            required
            value={categoryForm.name}
          />
          <Select
            label="Tipo"
            onChange={(event) =>
              setCategoryForm((current) => ({
                ...current,
                type: event.target.value as TransactionType,
              }))
            }
            options={[
              { label: "Despesa", value: "expense" },
              { label: "Receita", value: "income" },
            ]}
            value={categoryForm.type}
          />
          <Input
            label="Ícone"
            onChange={(event) =>
              setCategoryForm((current) => ({ ...current, icon: event.target.value }))
            }
            placeholder="tag"
            value={categoryForm.icon ?? ""}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Cor</p>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  aria-label={`Selecionar cor ${color}`}
                  className={`h-9 w-9 rounded-lg border ${
                    categoryForm.color === color ? "border-white" : "border-white/10"
                  }`}
                  key={color}
                  onClick={() => setCategoryForm((current) => ({ ...current, color }))}
                  style={{ background: color }}
                  type="button"
                />
              ))}
            </div>
          </div>
          <Button isFullWidth type="submit">
            Salvar categoria
          </Button>
        </form>
      </Modal>
    </PageFrame>
  );
}
