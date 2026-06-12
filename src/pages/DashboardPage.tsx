import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Plus,
  Sparkles,
} from "lucide-react";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState } from "../components/ui";

const walletCards = [
  {
    accent: "from-sky-400 to-blue-600",
    label: "Patrimônio líquido",
    value: "R$ 0,00",
  },
  {
    accent: "from-emerald-400 to-teal-600",
    label: "Receitas previstas",
    value: "R$ 0,00",
  },
  {
    accent: "from-rose-400 to-pink-600",
    label: "Despesas previstas",
    value: "R$ 0,00",
  },
];

const insights = [
  { label: "Entradas", value: "R$ 0,00", icon: ArrowUpRight, tone: "green" },
  { label: "Saidas", value: "R$ 0,00", icon: ArrowDownRight, tone: "pink" },
  { label: "Agenda", value: "0 eventos", icon: CalendarDays, tone: "blue" },
  { label: "Cartões", value: "0 ativos", icon: CreditCard, tone: "orange" },
] as const;

export function DashboardPage() {
  return (
    <PageFrame
      actions={<Button icon={<Plus className="h-4 w-4" />}>Nova entrada</Button>}
      description="A primeira tela do aplicativo está pronta para receber dados reais nas próximas sprints."
      title="Dashboard"
    >
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden p-0" tone="glass">
          <div className="grid min-h-80 gap-4 p-4 sm:p-5 md:grid-cols-3">
            {walletCards.map((card) => (
              <article
                className={`flex min-h-52 flex-col justify-between rounded-lg bg-gradient-to-br ${card.accent} p-5 text-white shadow-soft`}
                key={card.label}
              >
                <div>
                  <p className="text-sm font-medium text-white/72">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{card.value}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-white/72">
                  <span>Gestor</span>
                  <span>****</span>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card tone="elevated">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge tone="green">Pronto para evoluir</Badge>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Base premium sem dados fictícios
              </h2>
            </div>
            <Sparkles className="h-7 w-7 text-sky-300" />
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            O foco desta sprint é navegação, design system, hierarquia visual e
            experiência mobile-first.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {insights.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} tone="elevated">
              <div className="flex items-center justify-between gap-4">
                <Badge tone={item.tone}>{item.label}</Badge>
                <Icon className="h-5 w-5 text-zinc-300" />
              </div>
              <p className="mt-5 text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm text-zinc-400">Aguardando dados reais.</p>
            </Card>
          );
        })}
      </section>

      <EmptyState
        description="As próximas sprints vão conectar dados, regras financeiras e persistência. Por enquanto, a interface está preparada para crescer sem reorganização pesada."
        title="Nenhuma movimentação cadastrada ainda"
      />
    </PageFrame>
  );
}
