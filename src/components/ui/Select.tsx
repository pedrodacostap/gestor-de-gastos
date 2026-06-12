import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  helperText?: string;
  label?: string;
  options: SelectOption[];
};

export function Select({
  className,
  helperText,
  id,
  label,
  options,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
      {label && <span className="mb-2 block">{label}</span>}
      <span className="relative block">
        <select
          className={clsx(
            "h-12 w-full appearance-none rounded-lg border border-zinc-950/10 bg-white/70 px-4 pr-11 text-base text-zinc-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 dark:border-white/10 dark:bg-white/8 dark:text-white",
            className,
          )}
          id={selectId}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        />
      </span>
      {helperText && (
        <span className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">
          {helperText}
        </span>
      )}
    </label>
  );
}
