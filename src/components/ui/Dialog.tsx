import type { ReactNode } from "react";
import { Button } from "./Button";

type DialogProps = {
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel?: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function Dialog({
  cancelLabel = "Cancelar",
  children,
  confirmLabel = "Confirmar",
  isOpen,
  onCancel,
  onConfirm,
  title,
}: DialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xl"
      role="alertdialog"
    >
      <div className="w-full max-w-sm rounded-lg border border-white/12 bg-zinc-950/95 p-5 text-white shadow-float">
        <h2 className="text-lg font-semibold">{title}</h2>
        {children && <div className="mt-3 text-sm leading-6 text-zinc-300">{children}</div>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
