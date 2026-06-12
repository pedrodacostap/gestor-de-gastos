import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
};

export function Input({ className, helperText, id, label, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
      {label && <span className="mb-2 block">{label}</span>}
      <input
        className={clsx(
          "h-12 w-full rounded-lg border border-zinc-950/10 bg-white/70 px-4 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 dark:border-white/10 dark:bg-white/8 dark:text-white dark:placeholder:text-zinc-500",
          className,
        )}
        id={inputId}
        {...props}
      />
      {helperText && (
        <span className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">
          {helperText}
        </span>
      )}
    </label>
  );
}
