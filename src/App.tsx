import { Plus, Wallet, ReceiptText, CalendarDays, Target, CreditCard } from "lucide-react";

const cards = [
  { title: "Saldo total", value: "R$ 0,00", icon: Wallet },
  { title: "Despesas do mês", value: "R$ 0,00", icon: ReceiptText },
  { title: "Cartões", value: "R$ 0,00", icon: CreditCard },
  { title: "Metas", value: "0 ativas", icon: Target },
];

export default function App() {
  return (
    <main className="min-h-screen px-4 pb-24 pt-6 text-white md:px-8">
      <header className="mb-8">
        <p className="text-sm text-white/50">Gestor de Gastos</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Bom dia, Pedro 👋
        </h1>
      </header>

      <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
        <p className="text-sm text-white/60">Patrimônio líquido</p>
        <h2 className="mt-2 text-5xl font-semibold tracking-tight">R$ 0,00</h2>
        <p className="mt-4 text-sm text-emerald-300">
          Comece cadastrando sua primeira conta.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl"
            >
              <Icon className="mb-4 h-6 w-6 text-white/60" />
              <p className="text-sm text-white/50">{card.title}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {card.value}
              </p>
            </div>
          );
        })}
      </section>

      <nav className="fixed bottom-4 left-4 right-4 mx-auto flex max-w-md justify-around rounded-full border border-white/10 bg-black/60 p-2 backdrop-blur-2xl md:hidden">
        <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
          Resumo
        </button>
        <button className="px-4 py-2 text-sm text-white/60">Gastos</button>
        <button className="px-4 py-2 text-sm text-white/60">Metas</button>
      </nav>

      <button className="fixed bottom-24 right-5 grid h-14 w-14 place-items-center rounded-full bg-white text-black shadow-2xl md:bottom-8">
        <Plus />
      </button>
    </main>
  );
}