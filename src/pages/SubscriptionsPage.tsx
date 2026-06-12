import { Plus, Repeat, XCircle } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";
import { formatCurrency, formatDate } from "../lib/formatters";
import {
  cancelSubscription,
  createSubscription,
  createSubscriptionCharge,
  listPlannerData,
} from "../services/plannerService";
import { useAuth } from "../context/auth/useAuth";
import type { PlannerData, SubscriptionInput } from "../types/planner";

const emptyData: PlannerData = {
  accounts: [],
  budgetSummary: { percent: 0, remaining: 0, total: 0, used: 0 },
  budgets: [],
  calendarEvents: [],
  categories: [],
  nextCharges: [],
  nextDueEvents: [],
  subscriptionCharges: [],
  subscriptions: [],
};

const emptyForm: SubscriptionInput = {
  account_id: "",
  amount: 0,
  billing_day: 1,
  category_id: "",
  is_active: true,
  name: "",
  recurrence: "monthly",
};

export function SubscriptionsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PlannerData>(emptyData);
  const [form, setForm] = useState<SubscriptionInput>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setMessage("");
    try {
      setData(await listPlannerData(user.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar assinaturas.");
    }
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage("Sessão expirada. Faça login novamente.");
      return;
    }
    try {
      await createSubscription(user.id, form);
      setForm(emptyForm);
      setIsModalOpen(false);
      await loadData();
      setMessage("Assinatura criada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar assinatura.");
    }
  }

  return (
    <PageFrame
      actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>Nova assinatura</Button>}
      description="Acompanhe recorrências, próximas cobranças e gere a cobrança quando ela deve impactar uma conta."
      title="Assinaturas"
    >
      {message && (
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100" role="alert">
          {message}
        </p>
      )}

      {data.subscriptions.length === 0 ? (
        <EmptyState
          action={<Button onClick={() => setIsModalOpen(true)}>Criar assinatura</Button>}
          description="Netflix, Spotify, ChatGPT e outros serviços recorrentes aparecem aqui."
          icon={<Repeat className="h-6 w-6" />}
          title="Nenhuma assinatura cadastrada"
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.subscriptions.map((subscription) => (
            <Card key={subscription.id} tone="elevated">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone={subscription.is_active ? "blue" : "neutral"}>
                    {subscription.is_active ? "Ativa" : "Cancelada"}
                  </Badge>
                  <h2 className="mt-3 text-xl font-semibold text-white">{subscription.name}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{subscription.category?.name ?? "Sem categoria"}</p>
                </div>
                <p className="text-lg font-semibold text-white">{formatCurrency(Number(subscription.amount))}</p>
              </div>
              <p className="mt-5 text-sm text-zinc-400">
                Próxima cobrança: {formatDate(subscription.next_charge_date)}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button
                  disabled={!subscription.is_active}
                  onClick={() => user && createSubscriptionCharge(user.id, subscription).then(loadData).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Erro ao gerar cobrança."))}
                  variant="secondary"
                >
                  Gerar cobrança
                </Button>
                <Button
                  disabled={!subscription.is_active}
                  icon={<XCircle className="h-4 w-4" />}
                  onClick={() => user && cancelSubscription(user.id, subscription.id).then(loadData).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Erro ao cancelar assinatura."))}
                  variant="ghost"
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova assinatura">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Nome" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Input label="Valor" required step="0.01" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
          <Input label="Dia de cobrança" max="31" min="1" required type="number" value={form.billing_day} onChange={(event) => setForm((current) => ({ ...current, billing_day: Number(event.target.value) }))} />
          <Select label="Recorrência" options={[{ label: "Mensal", value: "monthly" }, { label: "Trimestral", value: "quarterly" }, { label: "Anual", value: "yearly" }]} value={form.recurrence} onChange={(event) => setForm((current) => ({ ...current, recurrence: event.target.value as SubscriptionInput["recurrence"] }))} />
          <Select label="Conta para cobrança" options={[{ label: "Sem transação automática", value: "" }, ...data.accounts.map((account) => ({ label: account.name, value: account.id }))]} value={form.account_id ?? ""} onChange={(event) => setForm((current) => ({ ...current, account_id: event.target.value }))} />
          <Select label="Categoria" options={[{ label: "Sem categoria", value: "" }, ...data.categories.filter((category) => category.type === "expense").map((category) => ({ label: category.name, value: category.id }))]} value={form.category_id ?? ""} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))} />
          <Button isFullWidth type="submit">Salvar assinatura</Button>
        </form>
      </Modal>
    </PageFrame>
  );
}
