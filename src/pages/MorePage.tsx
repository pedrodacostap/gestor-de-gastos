import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { navigationItems } from "../app/navigation";
import { PageFrame } from "../components/layout/PageFrame";

const morePaths = new Set([
  "/cartoes",
  "/dividas",
  "/calendario",
  "/assinaturas",
  "/orcamentos",
  "/configuracoes",
]);

export function MorePage() {
  const items = navigationItems.filter((item) => morePaths.has(item.path));

  return (
    <PageFrame
      description="Acesse todas as áreas do Gestor de Gastos no celular."
      title="Mais"
    >
      <nav aria-label="Outras áreas" className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="group flex min-h-24 items-center gap-4 rounded-2xl border border-white/10 bg-white/6 p-4 shadow-glass transition hover:border-white/20 hover:bg-white/10"
              key={item.path}
              to={item.path}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-sky-200">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">{item.label}</span>
                <span className="mt-1 block text-sm text-zinc-400">{item.description}</span>
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-white" />
            </Link>
          );
        })}
      </nav>
    </PageFrame>
  );
}
