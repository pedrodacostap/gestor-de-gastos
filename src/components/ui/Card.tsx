import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "solid" | "glass" | "elevated";
};

const toneClasses = {
  solid:
    "border-zinc-950/8 bg-white text-zinc-950 shadow-soft dark:border-white/10 dark:bg-zinc-900/90 dark:text-white",
  glass:
    "border-white/14 bg-white/12 text-white shadow-glass backdrop-blur-2xl dark:border-white/14",
  elevated:
    "border-zinc-950/8 bg-white/90 text-zinc-950 shadow-float backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:text-white",
};

export function Card({
  children,
  className,
  tone = "glass",
  ...props
}: CardProps) {
  return (
    <div
      className={clsx("rounded-lg border p-5 md:p-6", toneClasses[tone], className)}
      {...props}
    >
      {children}
    </div>
  );
}
