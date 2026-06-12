import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

type BadgeTone = "blue" | "green" | "orange" | "pink" | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  blue: "bg-sky-400/14 text-sky-200 ring-sky-300/20",
  green: "bg-emerald-400/14 text-emerald-200 ring-emerald-300/20",
  orange: "bg-amber-400/14 text-amber-200 ring-amber-300/20",
  pink: "bg-rose-400/14 text-rose-200 ring-rose-300/20",
  neutral: "bg-white/10 text-zinc-200 ring-white/10",
};

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ring-1",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
