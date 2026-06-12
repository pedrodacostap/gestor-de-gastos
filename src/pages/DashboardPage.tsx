import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Plus,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState } from "../components/ui";
import { getCurrentMonthValue } from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import { getDashboardData } from "../services/financeService";
import { useAuth } from "../context/auth/useAuth";
import type { DashboardData } from "../types/finance";

const emptyDashboard: DashboardData = {
  balanceTotal: 0,
  categoryExpenses: [],
  expensesMonth: 0,
  incomeMonth: 0,
  monthResult: 0,
  recentTransactions: [],
};

export function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!user) {
      return;
    }

    setMessage("");

    try {
      setData(await getDashboardData(user.id, month));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar dashboard.");
    }
  }, [month, user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  const cards = [
    {
      icon: Landmark,
      label: "Saldo total",
      tone: "blue",
      value: formatCurrency(data.balanceTotal),
    },
    {
      icon: ArrowUpRight,
      label: "Receitas do mês",
      tone: "green",
      value: formatCurrency(data.incomeMonth),
    },
    {
      icon: ArrowDownRight,
      label: "Despesas do mês",
      tone: "pink",
      value: formatCurrency(data.expensesMonth),
    },
    {
      icon: TrendingUp,
      label: "Resultado do mês",
      tone: data.monthResult >= 0 ? "green" : "orange",
      value: formatCurrency(data.monthResult),
    },
  ] as const;

  return (
    <PageFrame
      actions={
        <Link to="/transacoes">
          <Button icon={<Plus className="h-4 w-4" />}>Nova transação</Button>
        </Link>
      }
      description="Visão consolidada das contas, movimentações do mês e principais categorias de despesa."
      title="Dashboard"
    >
      {message && (
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          {message}
        </p>
      )}

      <Card tone="elevated">
        <label className="block max-w-xs text-sm font-medium text-zinc-200">
          Mês de referência
          <input
            className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-base text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20"
            onChange={(event) => setMonth(event.target.value)}
            type="month"
            value={month}
          />
        </label>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label} tone="elevated">
              <div className="flex items-center justify-between gap-4">
                <Badge tone={card.tone}>{card.label}</Badge>
                <Icon className="h-5 w-5 text-zinc-300" />
              </div>
              <p className="mt-5 text-3xl font-semibold text-white">{card.value}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card tone="elevated">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Últimas transações</h2>
              <p className="mt-1 text-sm text-zinc-400">Movimentações recentes do mês.</p>
            </div>
            <ReceiptText className="h-5 w-5 text-sky-300" />
          </div>

          {data.recentTransactions.length === 0 ? (
            <EmptyState
              description="Crie sua primeira conta e registre uma receita ou despesa para popular o dashboard."
              title="Sem transações no mês"
            />
          ) : (
            <div className="divide-y divide-white/10">
              {data.recentTransactions.map((transaction) => (
                <div
                  className="flex items-center justify-between gap-4 py-3"
                  key={transaction.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{transaction.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {formatDate(transaction.transaction_date)} ·{" "}
                      {transaction.category?.name ?? "Sem categoria"}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card tone="elevated">
          <h2 className="text-lg font-semibold text-white">Gastos por categoria</h2>
          <p className="mt-1 text-sm text-zinc-400">Ranking das despesas do mês.</p>

          {data.categoryExpenses.length === 0 ? (
            <p className="mt-8 rounded-lg border border-white/10 bg-white/8 p-4 text-sm text-zinc-300">
              Nenhuma despesa registrada neste mês.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {data.categoryExpenses.map((category) => {
                const percent =
                  data.expensesMonth > 0
                    ? Math.round((category.total / data.expensesMonth) * 100)
                    : 0;

                return (
                  <div key={category.name}>
                    <div className="mb-2 flex justify-between gap-4 text-sm">
                      <span className="text-zinc-200">{category.name}</span>
                      <span className="font-medium text-white">
                        {formatCurrency(category.total)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          background: category.color ?? "#0a84ff",
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>
    </PageFrame>
  );
}
