import {
  BellRing,
  CalendarClock,
  Check,
  Edit2,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Repeat2,
  RotateCcw,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageFrame } from "../components/layout/PageFrame";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  Modal,
  Select,
} from "../components/ui";
import { useAuth } from "../context/auth/useAuth";
import { getTodayValue } from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import {
  createFinancialReminder,
  createRecurringTransaction,
  deleteFinancialReminder,
  deleteRecurringTransaction,
  listPlanningInsights,
  processDueRecurringTransactions,
  reverseRecurringOccurrence,
  toggleRecurringTransaction,
  updateFinancialReminderStatus,
  updateRecurringTransaction,
} from "../services/insightsService";
import type { FinancialReminder } from "../types/database";
import type {
  FinancialReminderInput,
  PlanningInsightsData,
  RecurringTransactionInput,
  RecurringTransactionWithRelations,
} from "../types/insights";

type PlanningTab = "recurring" | "reminders" | "forecast";

const emptyData: PlanningInsightsData = {
  accounts: [],
  categories: [],
  forecast: [],
  occurrences: [],
  recurringTransactions: [],
  reminders: [],
};

function emptyRecurringForm(accountId = ""): RecurringTransactionInput {
  const today = getTodayValue();
  return {
    account_id: accountId,
    amount: 0,
    category_id: "",
    end_date: "",
    frequency: "monthly",
    interval_count: 1,
    is_active: true,
    next_due_date: today,
    notes: "",
    payment_method: "pix",
    start_date: today,
    title: "",
    type: "expense",
  };
}

function emptyReminderForm(): FinancialReminderInput {
  return {
    amount: null,
    due_date: getTodayValue(),
    kind: "manual",
    notes: "",
    title: "",
  };
}

const frequencyLabels = {
  monthly: "Mensal",
  weekly: "Semanal",
  yearly: "Anual",
};

const reminderKindLabels: Record<FinancialReminder["kind"], string> = {
  bill: "Conta a pagar",
  goal: "Meta",
  manual: "Lembrete",
  other: "Outro",
  tax: "Imposto",
};

function ForecastTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { balance: number; date: string; expenses: number; income: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/95 p-3 text-sm shadow-float">
      <p className="font-medium text-white">{formatDate(point.date)}</p>
      <p className="mt-1 text-sky-200">Saldo: {formatCurrency(point.balance)}</p>
      {point.income > 0 && <p className="text-emerald-300">+ {formatCurrency(point.income)}</p>}
      {point.expenses > 0 && <p className="text-rose-300">- {formatCurrency(point.expenses)}</p>}
    </div>
  );
}

export function PlanningPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PlanningTab>("recurring");
  const [data, setData] = useState<PlanningInsightsData>(emptyData);
  const [recurringForm, setRecurringForm] = useState<RecurringTransactionInput>(
    emptyRecurringForm(),
  );
  const [reminderForm, setReminderForm] = useState<FinancialReminderInput>(
    emptyReminderForm(),
  );
  const [editingRecurring, setEditingRecurring] =
    useState<RecurringTransactionWithRelations | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const loaded = await listPlanningInsights(user.id);
      setData(loaded);
      setRecurringForm((current) => ({
        ...current,
        account_id: current.account_id || loaded.accounts[0]?.id || "",
      }));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erro ao carregar o planejamento.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const filteredCategories = useMemo(
    () => data.categories.filter((category) => category.type === recurringForm.type),
    [data.categories, recurringForm.type],
  );

  const forecastSummary = useMemo(() => {
    const first = data.forecast[0]?.balance ?? 0;
    const last = data.forecast.at(-1)?.balance ?? first;
    const lowest = data.forecast.reduce(
      (minimum, point) => Math.min(minimum, point.balance),
      first,
    );
    return { change: last - first, ending: last, lowest };
  }, [data.forecast]);

  function openCreateRecurring() {
    setEditingRecurring(null);
    setRecurringForm(emptyRecurringForm(data.accounts[0]?.id ?? ""));
    setIsRecurringModalOpen(true);
  }

  function openEditRecurring(item: RecurringTransactionWithRelations) {
    setEditingRecurring(item);
    setRecurringForm({
      account_id: item.account_id,
      amount: Number(item.amount),
      category_id: item.category_id ?? "",
      end_date: item.end_date ?? "",
      frequency: item.frequency,
      interval_count: item.interval_count,
      is_active: item.is_active,
      next_due_date: item.next_due_date,
      notes: item.notes ?? "",
      payment_method: item.payment_method ?? "pix",
      start_date: item.start_date,
      title: item.title,
      type: item.type,
    });
    setIsRecurringModalOpen(true);
  }

  async function handleRecurringSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !recurringForm.account_id) {
      setMessage("Cadastre ou selecione uma conta antes de salvar a recorrência.");
      return;
    }

    try {
      if (editingRecurring) {
        await updateRecurringTransaction(user.id, editingRecurring.id, recurringForm);
      } else {
        await createRecurringTransaction(user.id, recurringForm);
      }
      setIsRecurringModalOpen(false);
      await loadData();
      setMessage(
        editingRecurring
          ? "Recorrência atualizada com sucesso."
          : "Recorrência criada e lançamentos vencidos processados.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar recorrência.");
    }
  }

  async function handleProcessRecurring() {
    setIsProcessing(true);
    try {
      const count = await processDueRecurringTransactions();
      await loadData();
      setMessage(
        count > 0
          ? `${count} lançamento${count === 1 ? "" : "s"} recorrente${count === 1 ? "" : "s"} criado${count === 1 ? "" : "s"}.`
          : "Nenhum lançamento recorrente estava vencido.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao processar recorrências.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleToggleRecurring(item: RecurringTransactionWithRelations) {
    if (!user) return;
    try {
      await toggleRecurringTransaction(user.id, item.id, !item.is_active);
      await loadData();
      setMessage(item.is_active ? "Recorrência pausada." : "Recorrência reativada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao alterar recorrência.");
    }
  }

  async function handleDeleteRecurring(item: RecurringTransactionWithRelations) {
    if (!window.confirm(`Excluir a recorrência “${item.title}”?`)) return;
    try {
      await deleteRecurringTransaction(item.id);
      await loadData();
      setMessage("Recorrência excluída.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao excluir recorrência.");
    }
  }

  async function handleReverseOccurrence(occurrenceId: string) {
    if (!window.confirm("Desfazer este lançamento e remover a transação vinculada?")) return;
    try {
      await reverseRecurringOccurrence(occurrenceId);
      await loadData();
      setMessage("Lançamento recorrente desfeito.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao desfazer lançamento.");
    }
  }

  async function handleReminderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await createFinancialReminder(user.id, reminderForm);
      setReminderForm(emptyReminderForm());
      setIsReminderModalOpen(false);
      await loadData();
      setMessage("Lembrete criado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar lembrete.");
    }
  }

  async function handleReminderStatus(
    reminder: FinancialReminder,
    status: FinancialReminder["status"],
  ) {
    if (!user) return;
    try {
      await updateFinancialReminderStatus(user.id, reminder.id, status);
      await loadData();
      setMessage(status === "completed" ? "Lembrete concluído." : "Lembrete dispensado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao atualizar lembrete.");
    }
  }

  async function handleDeleteReminder(reminder: FinancialReminder) {
    if (!user || !window.confirm(`Excluir o lembrete “${reminder.title}”?`)) return;
    try {
      await deleteFinancialReminder(user.id, reminder.id);
      await loadData();
      setMessage("Lembrete excluído.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao excluir lembrete.");
    }
  }

  async function handleNotifications() {
    if (!("Notification" in window)) {
      setMessage("Este navegador não oferece notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("As notificações não foram autorizadas no navegador.");
      return;
    }

    const today = getTodayValue();
    const upcoming = data.reminders.filter(
      (reminder) => reminder.status === "pending" && reminder.due_date >= today,
    );
    const next = upcoming[0];
    if (next) {
      new Notification("Gestor de Gastos", {
        body: `${next.title} · ${formatDate(next.due_date)}${next.amount ? ` · ${formatCurrency(Number(next.amount))}` : ""}`,
        icon: "/logo-oficial.png",
      });
      setMessage("Notificações ativadas. O próximo lembrete foi exibido.");
    } else {
      setMessage("Notificações ativadas. Não há lembretes pendentes.");
    }
  }

  const tabActions =
    activeTab === "recurring" ? (
      <>
        <Button
          disabled={isProcessing}
          icon={<RefreshCcw className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />}
          onClick={handleProcessRecurring}
          variant="secondary"
        >
          Atualizar lançamentos
        </Button>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreateRecurring}>
          Nova recorrência
        </Button>
      </>
    ) : activeTab === "reminders" ? (
      <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsReminderModalOpen(true)}>
        Novo lembrete
      </Button>
    ) : undefined;

  return (
    <PageFrame
      actions={tabActions}
      description="Automatize lançamentos, organize lembretes e veja como seu saldo pode evoluir nos próximos 90 dias."
      title="Planejamento"
    >
      {message && (
        <p className="rounded-lg border border-sky-300/20 bg-sky-300/10 p-3 text-sm text-sky-100" role="status">
          {message}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/6 p-2" role="tablist">
        {([
          ["recurring", "Recorrências", Repeat2],
          ["reminders", "Lembretes", BellRing],
          ["forecast", "Previsão", TrendingUp],
        ] as const).map(([value, label, Icon]) => (
          <button
            aria-selected={activeTab === value}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition ${
              activeTab === value ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/10"
            }`}
            key={value}
            onClick={() => setActiveTab(value)}
            role="tab"
            type="button"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Atualizando planejamento" />
      ) : activeTab === "recurring" ? (
        <>
          {data.recurringTransactions.length === 0 ? (
            <EmptyState
              action={<Button onClick={openCreateRecurring}>Criar recorrência</Button>}
              description="Cadastre salário, aluguel e outras movimentações frequentes para gerar lançamentos automaticamente."
              icon={<Repeat2 className="h-6 w-6" />}
              title="Nenhuma recorrência cadastrada"
            />
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.recurringTransactions.map((item) => {
                const hasHistory = data.occurrences.some(
                  (occurrence) => occurrence.recurring_transaction_id === item.id,
                );
                return (
                  <Card key={item.id} tone="elevated">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={item.is_active ? "blue" : "neutral"}>
                            {item.is_active ? "Ativa" : "Pausada"}
                          </Badge>
                          <Badge tone={item.type === "income" ? "green" : "pink"}>
                            {item.type === "income" ? "Receita" : "Despesa"}
                          </Badge>
                        </div>
                        <h2 className="mt-3 truncate text-lg font-semibold text-white">{item.title}</h2>
                        <p className="mt-1 text-sm text-zinc-400">
                          {item.account?.name ?? "Conta"} · {item.category?.name ?? "Sem categoria"}
                        </p>
                      </div>
                      <p className={item.type === "income" ? "font-semibold text-emerald-300" : "font-semibold text-rose-300"}>
                        {formatCurrency(Number(item.amount))}
                      </p>
                    </div>
                    <div className="mt-5 rounded-lg bg-white/6 p-3 text-sm text-zinc-300">
                      <p>{frequencyLabels[item.frequency]}{item.interval_count > 1 ? ` · a cada ${item.interval_count} períodos` : ""}</p>
                      <p className="mt-1">Próximo lançamento: {formatDate(item.next_due_date)}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button aria-label="Editar recorrência" onClick={() => openEditRecurring(item)} size="sm" variant="ghost">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        icon={item.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        onClick={() => handleToggleRecurring(item)}
                        size="sm"
                        variant="secondary"
                      >
                        {item.is_active ? "Pausar" : "Reativar"}
                      </Button>
                      {!hasHistory && (
                        <Button aria-label="Excluir recorrência" onClick={() => handleDeleteRecurring(item)} size="sm" variant="danger">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </section>
          )}

          {data.occurrences.length > 0 && (
            <Card tone="elevated">
              <div className="mb-4 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-sky-300" />
                <h2 className="text-lg font-semibold text-white">Lançamentos gerados</h2>
              </div>
              <div className="divide-y divide-white/10">
                {data.occurrences.slice(0, 12).map((occurrence) => (
                  <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={occurrence.id}>
                    <div>
                      <p className="font-medium text-white">{occurrence.recurring?.title ?? occurrence.transaction?.title ?? "Recorrência"}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {formatDate(occurrence.due_date)} · {formatCurrency(Number(occurrence.transaction?.amount ?? 0))}
                      </p>
                    </div>
                    <Button icon={<RotateCcw className="h-4 w-4" />} onClick={() => handleReverseOccurrence(occurrence.id)} size="sm" variant="danger">
                      Desfazer
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : activeTab === "reminders" ? (
        <>
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" tone="elevated">
            <div>
              <h2 className="font-semibold text-white">Avisos do navegador</h2>
              <p className="mt-1 text-sm text-zinc-400">Ative quando quiser visualizar o próximo compromisso pendente.</p>
            </div>
            <Button icon={<BellRing className="h-4 w-4" />} onClick={handleNotifications} variant="secondary">
              Ativar notificações
            </Button>
          </Card>

          {data.reminders.length === 0 ? (
            <EmptyState
              action={<Button onClick={() => setIsReminderModalOpen(true)}>Criar lembrete</Button>}
              description="Anote contas, impostos, metas e compromissos financeiros para não perder prazos."
              icon={<BellRing className="h-6 w-6" />}
              title="Nenhum lembrete cadastrado"
            />
          ) : (
            <section className="grid gap-3">
              {data.reminders.map((reminder) => {
                const overdue = reminder.status === "pending" && reminder.due_date < getTodayValue();
                return (
                  <Card className="p-4" key={reminder.id} tone="elevated">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={reminder.status === "completed" ? "green" : overdue ? "pink" : reminder.status === "dismissed" ? "neutral" : "orange"}>
                            {reminder.status === "completed" ? "Concluído" : reminder.status === "dismissed" ? "Dispensado" : overdue ? "Atrasado" : "Pendente"}
                          </Badge>
                          <Badge>{reminderKindLabels[reminder.kind]}</Badge>
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-white">{reminder.title}</h2>
                        <p className="mt-1 text-sm text-zinc-400">
                          {formatDate(reminder.due_date)}{reminder.amount !== null ? ` · ${formatCurrency(Number(reminder.amount))}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {reminder.status === "pending" && (
                          <>
                            <Button aria-label="Concluir lembrete" onClick={() => handleReminderStatus(reminder, "completed")} size="sm" variant="secondary">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleReminderStatus(reminder, "dismissed")} size="sm" variant="ghost">
                              Dispensar
                            </Button>
                          </>
                        )}
                        <Button aria-label="Excluir lembrete" onClick={() => handleDeleteReminder(reminder)} size="sm" variant="danger">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </section>
          )}
        </>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Card tone="elevated">
              <p className="text-sm text-zinc-400">Saldo em 90 dias</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(forecastSummary.ending)}</p>
            </Card>
            <Card tone="elevated">
              <p className="text-sm text-zinc-400">Menor saldo previsto</p>
              <p className={`mt-2 text-2xl font-semibold ${forecastSummary.lowest < 0 ? "text-rose-300" : "text-white"}`}>{formatCurrency(forecastSummary.lowest)}</p>
            </Card>
            <Card tone="elevated">
              <p className="text-sm text-zinc-400">Variação prevista</p>
              <p className={`mt-2 text-2xl font-semibold ${forecastSummary.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrency(forecastSummary.change)}</p>
            </Card>
          </section>
          <Card tone="elevated">
            <h2 className="text-lg font-semibold text-white">Projeção de saldo</h2>
            <p className="mt-1 text-sm text-zinc-400">Estimativa baseada no saldo atual e nas recorrências ativas.</p>
            <div className="mt-5 h-80">
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={data.forecast}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" interval={14} stroke="#a1a1aa" tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ForecastTooltip />} />
                  <Area dataKey="balance" fill="url(#forecastGradient)" name="Saldo" stroke="#0a84ff" strokeWidth={3} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <p className="rounded-lg border border-white/10 bg-white/6 p-4 text-sm leading-6 text-zinc-400">
            A previsão é uma estimativa: compras avulsas, rendimentos e movimentações ainda não cadastradas podem alterar o saldo real.
          </p>
        </>
      )}

      <Modal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} title={editingRecurring ? "Editar recorrência" : "Nova recorrência"}>
        <form className="max-h-[75vh] space-y-4 overflow-y-auto pr-1" onSubmit={handleRecurringSubmit}>
          <Select
            label="Tipo"
            onChange={(event) => setRecurringForm((current) => ({ ...current, category_id: "", type: event.target.value as RecurringTransactionInput["type"] }))}
            options={[{ label: "Despesa", value: "expense" }, { label: "Receita", value: "income" }]}
            value={recurringForm.type}
          />
          <Input label="Título" onChange={(event) => setRecurringForm((current) => ({ ...current, title: event.target.value }))} placeholder="Salário, aluguel, academia..." required value={recurringForm.title} />
          <Input label="Valor" min="0.01" onChange={(event) => setRecurringForm((current) => ({ ...current, amount: Number(event.target.value) }))} required step="0.01" type="number" value={recurringForm.amount} />
          <Select label="Conta" onChange={(event) => setRecurringForm((current) => ({ ...current, account_id: event.target.value }))} options={data.accounts.map((account) => ({ label: account.name, value: account.id }))} value={recurringForm.account_id} />
          <Select label="Categoria" onChange={(event) => setRecurringForm((current) => ({ ...current, category_id: event.target.value }))} options={[{ label: "Sem categoria", value: "" }, ...filteredCategories.map((category) => ({ label: category.name, value: category.id }))]} value={recurringForm.category_id ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Frequência" onChange={(event) => setRecurringForm((current) => ({ ...current, frequency: event.target.value as RecurringTransactionInput["frequency"] }))} options={[{ label: "Semanal", value: "weekly" }, { label: "Mensal", value: "monthly" }, { label: "Anual", value: "yearly" }]} value={recurringForm.frequency} />
            <Input helperText="Use 1 para todo período." label="Repetir a cada" min="1" onChange={(event) => setRecurringForm((current) => ({ ...current, interval_count: Number(event.target.value) }))} required type="number" value={recurringForm.interval_count} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Primeira data" onChange={(event) => setRecurringForm((current) => ({ ...current, next_due_date: editingRecurring ? current.next_due_date : event.target.value, start_date: event.target.value }))} required type="date" value={recurringForm.start_date} />
            <Input label="Próximo lançamento" min={recurringForm.start_date} onChange={(event) => setRecurringForm((current) => ({ ...current, next_due_date: event.target.value }))} required type="date" value={recurringForm.next_due_date} />
          </div>
          <Input helperText="Opcional. Deixe vazio para repetir sem prazo final." label="Data final" min={recurringForm.start_date} onChange={(event) => setRecurringForm((current) => ({ ...current, end_date: event.target.value }))} type="date" value={recurringForm.end_date ?? ""} />
          <Select label="Forma de pagamento" onChange={(event) => setRecurringForm((current) => ({ ...current, payment_method: event.target.value }))} options={[{ label: "Pix", value: "pix" }, { label: "Débito", value: "debit" }, { label: "Dinheiro", value: "cash" }, { label: "Transferência", value: "transfer" }, { label: "Outro", value: "recurring" }]} value={recurringForm.payment_method ?? "pix"} />
          <textarea className="min-h-20 w-full rounded-lg border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20" onChange={(event) => setRecurringForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Observações" value={recurringForm.notes ?? ""} />
          <Button disabled={data.accounts.length === 0} isFullWidth type="submit">Salvar recorrência</Button>
        </form>
      </Modal>

      <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title="Novo lembrete">
        <form className="space-y-4" onSubmit={handleReminderSubmit}>
          <Input label="Título" onChange={(event) => setReminderForm((current) => ({ ...current, title: event.target.value }))} placeholder="Pagar condomínio, renovar seguro..." required value={reminderForm.title} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Data" onChange={(event) => setReminderForm((current) => ({ ...current, due_date: event.target.value }))} required type="date" value={reminderForm.due_date} />
            <Input label="Valor (opcional)" min="0" onChange={(event) => setReminderForm((current) => ({ ...current, amount: event.target.value ? Number(event.target.value) : null }))} step="0.01" type="number" value={reminderForm.amount ?? ""} />
          </div>
          <Select label="Tipo" onChange={(event) => setReminderForm((current) => ({ ...current, kind: event.target.value as FinancialReminderInput["kind"] }))} options={[{ label: "Lembrete", value: "manual" }, { label: "Conta a pagar", value: "bill" }, { label: "Meta", value: "goal" }, { label: "Imposto", value: "tax" }, { label: "Outro", value: "other" }]} value={reminderForm.kind} />
          <textarea className="min-h-24 w-full rounded-lg border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20" onChange={(event) => setReminderForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Observações" value={reminderForm.notes ?? ""} />
          <Button isFullWidth type="submit">Salvar lembrete</Button>
        </form>
      </Modal>
    </PageFrame>
  );
}
