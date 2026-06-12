import { Edit2, Landmark, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";
import { formatCurrency } from "../lib/formatters";
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
} from "../services/financeService";
import { useAuth } from "../context/auth/useAuth";
import type { AccountInput, AccountWithBalance } from "../types/finance";

const accountTypes = [
  { label: "Conta corrente", value: "checking" },
  { label: "Poupança", value: "savings" },
  { label: "Carteira", value: "cash" },
  { label: "Investimento", value: "investment" },
];

const colors = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff375f"];

const emptyForm: AccountInput = {
  bank: "",
  color: colors[0],
  initial_balance: 0,
  name: "",
  type: "checking",
};

export function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [editingAccount, setEditingAccount] = useState<AccountWithBalance | null>(null);
  const [form, setForm] = useState<AccountInput>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const totalBalance = useMemo(
    () => accounts.reduce((total, account) => total + account.current_balance, 0),
    [accounts],
  );

  const loadAccounts = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      setAccounts(await listAccounts(user.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar contas.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAccounts]);

  function openCreateModal() {
    setEditingAccount(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(account: AccountWithBalance) {
    setEditingAccount(account);
    setForm({
      bank: account.bank ?? "",
      color: account.color ?? colors[0],
      initial_balance: Number(account.initial_balance),
      name: account.name,
      type: account.type,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, form);
      } else {
        await createAccount(user.id, form);
      }

      setIsModalOpen(false);
      await loadAccounts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar conta.");
    }
  }

  async function handleDelete(account: AccountWithBalance) {
    try {
      await deleteAccount(account.id);
      await loadAccounts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao excluir conta.");
    }
  }

  return (
    <PageFrame
      actions={<Button icon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>Nova conta</Button>}
      description="Gerencie contas, carteiras e saldos iniciais. O saldo atual considera receitas e despesas registradas."
      title="Contas"
    >
      {message && (
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          {message}
        </p>
      )}

      <Card tone="elevated">
        <p className="text-sm text-zinc-400">Saldo total</p>
        <p className="mt-2 text-4xl font-semibold text-white">
          {formatCurrency(totalBalance)}
        </p>
      </Card>

      {accounts.length === 0 && !isLoading ? (
        <EmptyState
          action={<Button onClick={openCreateModal}>Criar primeira conta</Button>}
          description="Cadastre uma conta corrente, carteira ou poupança para começar a registrar movimentações."
          icon={<Landmark className="h-6 w-6" />}
          title="Nenhuma conta cadastrada"
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} tone="elevated">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-11 w-2 rounded-full"
                    style={{ background: account.color ?? "#0a84ff" }}
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">
                      {account.name}
                    </h2>
                    <p className="text-sm text-zinc-400">{account.bank || "Sem banco"}</p>
                  </div>
                </div>
                <Badge>{accountTypes.find((item) => item.value === account.type)?.label ?? account.type}</Badge>
              </div>

              <p className="mt-6 text-sm text-zinc-400">Saldo atual</p>
              <p className="mt-1 text-3xl font-semibold text-white">
                {formatCurrency(account.current_balance)}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {account.transaction_count} transações vinculadas
              </p>

              <div className="mt-5 flex gap-2">
                <Button
                  icon={<Edit2 className="h-4 w-4" />}
                  onClick={() => openEditModal(account)}
                  variant="secondary"
                >
                  Editar
                </Button>
                <Button
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => handleDelete(account)}
                  variant="ghost"
                >
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? "Editar conta" : "Nova conta"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nome"
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nubank, Itaú, Carteira"
            required
            value={form.name}
          />
          <Input
            label="Banco"
            onChange={(event) => setForm((current) => ({ ...current, bank: event.target.value }))}
            placeholder="Opcional"
            value={form.bank ?? ""}
          />
          <Select
            label="Tipo"
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            options={accountTypes}
            value={form.type}
          />
          <Input
            label="Saldo inicial"
            min="0"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                initial_balance: Number(event.target.value),
              }))
            }
            step="0.01"
            type="number"
            value={form.initial_balance}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Cor</p>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  aria-label={`Selecionar cor ${color}`}
                  className={`h-9 w-9 rounded-lg border ${
                    form.color === color ? "border-white" : "border-white/10"
                  }`}
                  key={color}
                  onClick={() => setForm((current) => ({ ...current, color }))}
                  style={{ background: color }}
                  type="button"
                />
              ))}
            </div>
          </div>
          <Button isFullWidth type="submit">
            Salvar conta
          </Button>
        </form>
      </Modal>
    </PageFrame>
  );
}
