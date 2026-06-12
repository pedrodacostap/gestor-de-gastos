import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "./Card";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon = <Sparkles aria-hidden="true" className="h-6 w-6" />,
  title,
}: EmptyStateProps) {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-white/12 text-white shadow-glass">
        {icon}
      </div>
      <h2 className="max-w-md text-xl font-semibold text-white">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-zinc-300">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}
