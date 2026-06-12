import type { ReactNode } from "react";
import { Badge } from "../ui";

type PageFrameProps = {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

export function PageFrame({
  actions,
  children,
  description,
  eyebrow = "Gestor de Gastos",
  title,
}: PageFrameProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Badge tone="blue">{eyebrow}</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
            {description}
          </p>
        </div>
        {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
