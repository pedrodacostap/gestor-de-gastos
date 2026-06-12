import type { ReactNode } from "react";
import { Card } from "../ui";

type AuthLayoutProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthLayout({ children, description, title }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <section className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="max-w-md">
              <div className="mb-8 grid h-14 w-14 place-items-center rounded-lg bg-white text-2xl font-bold text-zinc-950 shadow-soft">
                G
              </div>
              <p className="text-sm font-semibold text-sky-300">
                Gestor de Gastos
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight">
                Finanças pessoais com clareza de app nativo.
              </h1>
              <p className="mt-5 text-base leading-7 text-zinc-300">
                Uma base segura para evoluir autenticação, dados e experiência
                financeira nas próximas sprints.
              </p>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md" tone="glass">
            <div className="mb-7">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-white text-xl font-bold text-zinc-950 shadow-soft lg:hidden">
                G
              </div>
              <h2 className="text-3xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {description}
              </p>
            </div>
            {children}
          </Card>
        </section>
      </div>
    </main>
  );
}
