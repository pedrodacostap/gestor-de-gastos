import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState, Input, Select } from "../components/ui";
import { getCurrentMonthValue } from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import { listPlannerData } from "../services/plannerService";
import { useAuth } from "../context/auth/useAuth";
import type { CalendarEvent, CalendarEventKind } from "../types/planner";

const eventTone: Record<CalendarEventKind, "blue" | "green" | "orange" | "pink" | "neutral"> = {
  debt: "orange",
  expense: "pink",
  goal: "blue",
  income: "green",
  installment: "orange",
  invoice: "orange",
  subscription: "blue",
};

const eventLabel: Record<CalendarEventKind, string> = {
  debt: "Dívida",
  expense: "Despesa",
  goal: "Meta",
  income: "Receita",
  installment: "Parcela",
  invoice: "Fatura",
  subscription: "Assinatura",
};

function addMonth(month: string, step: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + step, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [day, setDay] = useState(`${getCurrentMonthValue()}-01`);
  const [view, setView] = useState<"year" | "month" | "day">("month");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setMessage("");
    try {
      const data = await listPlannerData(user.id, month);
      setEvents(data.calendarEvents);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar calendário.");
    } finally {
      setIsLoading(false);
    }
  }, [month, user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const monthEvents = useMemo(
    () => events.filter((event) => event.date.startsWith(month)),
    [events, month],
  );
  const dayEvents = useMemo(
    () => events.filter((event) => event.date === day),
    [day, events],
  );
  const yearMonths = useMemo(() => {
    const year = month.slice(0, 4);
    return Array.from({ length: 12 }, (_, index) => {
      const value = `${year}-${String(index + 1).padStart(2, "0")}`;
      return {
        events: events.filter((event) => event.date.startsWith(value)),
        label: new Date(Number(year), index, 1).toLocaleDateString("pt-BR", {
          month: "short",
        }),
        value,
      };
    });
  }, [events, month]);

  function renderEvent(event: CalendarEvent) {
    return (
      <Card className="p-4" key={`${event.kind}-${event.id}-${event.date}`} tone="elevated">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge tone={eventTone[event.kind]}>{eventLabel[event.kind]}</Badge>
            <h2 className="mt-2 truncate text-base font-semibold text-white">{event.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{formatDate(event.date)}</p>
          </div>
          {event.amount ? (
            <p className="shrink-0 text-sm font-semibold text-white">
              {formatCurrency(event.amount)}
            </p>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <PageFrame
      actions={
        <Select
          aria-label="Visualização"
          onChange={(event) => setView(event.target.value as "year" | "month" | "day")}
          options={[
            { label: "Ano", value: "year" },
            { label: "Mês", value: "month" },
            { label: "Dia", value: "day" },
          ]}
          value={view}
        />
      }
      description="Receitas, despesas, faturas, parcelas, assinaturas, dívidas e metas em uma agenda financeira."
      title="Calendário"
    >
      {message && (
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100" role="alert">
          {message}
        </p>
      )}

      <Card className="p-4" tone="elevated">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <Button onClick={() => setMonth((current) => addMonth(current, -1))} variant="secondary">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input label="Mês" onChange={(event) => {
            setMonth(event.target.value);
            setDay(`${event.target.value}-01`);
          }} type="month" value={month} />
          <Button onClick={() => setMonth((current) => addMonth(current, 1))} variant="secondary">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {view === "day" ? (
          <div className="mt-4">
            <Input label="Dia" onChange={(event) => setDay(event.target.value)} type="date" value={day} />
          </div>
        ) : null}
      </Card>

      {view === "year" ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {yearMonths.map((item) => (
            <Card className="p-4" key={item.value} tone="elevated">
              <button className="w-full text-left" onClick={() => {
                setMonth(item.value);
                setView("month");
              }} type="button">
                <p className="text-sm font-semibold uppercase text-zinc-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.events.length}</p>
                <p className="text-sm text-zinc-400">eventos</p>
              </button>
            </Card>
          ))}
        </section>
      ) : null}

      {view === "month" ? (
        monthEvents.length > 0 ? (
          <section className="grid gap-3 md:grid-cols-2">{monthEvents.map(renderEvent)}</section>
        ) : !isLoading ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="Nenhum evento no mês"
            description="Receitas, despesas e vencimentos aparecem aqui quando existirem dados no período."
          />
        ) : null
      ) : null}

      {view === "day" ? (
        dayEvents.length > 0 ? (
          <section className="grid gap-3 md:grid-cols-2">{dayEvents.map(renderEvent)}</section>
        ) : !isLoading ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="Nenhum evento no dia"
            description="Selecione outra data ou cadastre movimentações financeiras."
          />
        ) : null
      ) : null}
    </PageFrame>
  );
}
