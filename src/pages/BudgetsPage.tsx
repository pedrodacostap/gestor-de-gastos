import { BadgeDollarSign, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";
import { getCurrentMonthValue } from "../lib/dates";
import { formatCurrency } from "../lib/formatters";
import { createBudget, deleteBudget, listPlannerData } from "../services/plannerService";
import { useAuth } from "../context/auth/useAuth";
import type { BudgetInput, PlannerData } from "../types/planner";

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

export function BudgetsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PlannerData>(emptyData);
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [form, setForm] = useState<BudgetInput>({ amount: 0, category_id: "", month });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setMessage("");
    try {
      const nextData = await listPlannerData(user.id, month);
      setData(nextData);
      setForm((current) => ({
        ...current,
        category_id: current.category_id || nextData.categories.find((category) => category.type === "expense")?.id || "",
        month,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar orçamentos.");
    }
  }, [month, user]);

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
    if (!form.category_id) {
      setMessage("Selecione uma categoria para criar o orçamento.");
      return;
    }
    try {
      await createBudget(user.id, { ...form, month });
      setIsModalOpen(false);
      await loadData();
      setMessage("Orçamento salvo com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar orçamento.");
    }
  }

  return (
    <PageFrame
      actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>Novo orçamento</Button>}
      description="Defina limites por categoria e acompanhe usado, restante e percentual com transações reais do mês."
      title="Orçamentos"
    >
      {message && (
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100" role="alert">
          {message}
        </p>
      )}

      <Card tone="elevated">
        <div className="grid gap-4 md:grid-cols-4 md:items-end">
          <Input label="Mês" onChange={(event) => setMonth(event.target.value)} type="month" value={month} />
          <div>
            <p className="text-sm text-zinc-400">Planejado</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(data.budgetSummary.total)}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Usado</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(data.budgetSummary.used)}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Restante</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(data.budgetSummary.remaining)}</p>
          </div>
        </div>
      </Card>

      {data.budgets.length === 0 ? (
        <EmptyState
          action={<Button onClick={() => setIsModalOpen(true)}>Criar orçamento</Button>}
          description="Crie limites para categorias de despesa e acompanhe alertas de 80% e 100%."
          icon={<BadgeDollarSign className="h-6 w-6" />}
          title="Nenhum orçamento no mês"
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.budgets.map((budget) => (
            <Card key={budget.id} tone="elevated">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone={budget.status === "exceeded" || budget.status === "reached" ? "pink" : budget.status === "warning" ? "orange" : "green"}>
                    {budget.status === "exceeded" ? "Ultrapassou" : budget.status === "reached" ? "100%" : budget.status === "warning" ? "80%" : "OK"}
                  </Badge>
                  <h2 className="mt-3 text-xl font-semibold text-white">{budget.category?.name ?? "Categoria"}</h2>
                </div>
                <Button aria-label="Excluir orçamento" onClick={() => user && deleteBudget(user.id, budget.id).then(loadData).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Erro ao excluir orçamento."))} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-sky-300" style={{ width: `${Math.min(budget.percent, 100)}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-zinc-400">Usado</p><p className="font-semibold text-white">{formatCurrency(budget.used)}</p></div>
                <div><p className="text-zinc-400">Limite</p><p className="font-semibold text-white">{formatCurrency(Number(budget.amount))}</p></div>
                <div><p className="text-zinc-400">Restante</p><p className="font-semibold text-white">{formatCurrency(budget.remaining)}</p></div>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo orçamento">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Select label="Categoria" options={data.categories.filter((category) => category.type === "expense").map((category) => ({ label: category.name, value: category.id }))} value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))} />
          <Input label="Valor limite" required step="0.01" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
          <Button isFullWidth type="submit">Salvar orçamento</Button>
        </form>
      </Modal>
    </PageFrame>
  );
}
