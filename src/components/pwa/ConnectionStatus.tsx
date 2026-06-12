import { Cloud, CloudOff, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

type SyncState = "offline" | "syncing" | "saved";

function getInitialState(): SyncState {
  if (typeof navigator === "undefined") {
    return "saved";
  }

  return navigator.onLine ? "saved" : "offline";
}

export function ConnectionStatus() {
  const [syncState, setSyncState] = useState<SyncState>(getInitialState);

  useEffect(() => {
    let timeoutId: number | undefined;

    function handleOnline() {
      setSyncState("syncing");
      timeoutId = window.setTimeout(() => setSyncState("saved"), 1400);
    }

    function handleOffline() {
      window.clearTimeout(timeoutId);
      setSyncState("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const status = {
    offline: {
      className: "border-rose-400/25 bg-rose-500/12 text-rose-100",
      icon: <CloudOff aria-hidden="true" className="h-4 w-4" />,
      label: "Offline",
      title: "Sem conexão. Dados já carregados seguem visíveis.",
    },
    syncing: {
      className: "border-sky-400/25 bg-sky-500/12 text-sky-100",
      icon: <RefreshCcw aria-hidden="true" className="h-4 w-4 animate-spin" />,
      label: "Sincronizando",
      title: "Conexão restaurada. Atualizando dados do app.",
    },
    saved: {
      className: "border-emerald-400/25 bg-emerald-500/12 text-emerald-100",
      icon: <Cloud aria-hidden="true" className="h-4 w-4" />,
      label: "Salvo",
      title: "Conectado. Alterações podem ser salvas normalmente.",
    },
  }[syncState];

  return (
    <div
      className={[
        "inline-flex h-9 w-9 items-center justify-center gap-2 rounded-full border px-0 text-xs font-semibold shadow-glass sm:w-auto sm:px-3",
        status.className,
      ].join(" ")}
      title={status.title}
    >
      {status.icon}
      <span className="hidden sm:inline">{status.label}</span>
    </div>
  );
}
