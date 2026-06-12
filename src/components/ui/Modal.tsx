import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Modal({ children, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-3 backdrop-blur-xl sm:items-center"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-lg border border-white/12 bg-zinc-950/92 p-5 text-white shadow-float">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button aria-label="Fechar" onClick={onClose} size="sm" variant="ghost">
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
