import { clsx } from "clsx";

type LoadingStateProps = {
  className?: string;
  label?: string;
};

export function LoadingState({
  className,
  label = "Carregando",
}: LoadingStateProps) {
  return (
    <div
      className={clsx(
        "flex min-h-52 flex-col items-center justify-center gap-4 rounded-lg border border-white/12 bg-white/8 text-zinc-300 shadow-glass backdrop-blur-2xl",
        className,
      )}
      role="status"
    >
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-white" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
