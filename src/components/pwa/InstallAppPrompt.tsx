import { Download, Share } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isAppleMobile() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [standalone] = useState(isStandalone);

  const showAppleHelp = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return isAppleMobile() && !standalone;
  }, [standalone]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setDismissed(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstall() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setDismissed(true);
  }

  if (standalone || dismissed || (!installEvent && !showAppleHelp)) {
    return null;
  }

  return (
    <section className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-50 mx-auto max-w-md rounded-2xl border border-white/12 bg-zinc-950/88 p-3 text-white shadow-glass backdrop-blur-2xl lg:bottom-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-zinc-950">
          {showAppleHelp ? (
            <Share aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Download aria-hidden="true" className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instale o Gestor de Gastos</p>
          <p className="mt-1 text-xs leading-5 text-zinc-300">
            {showAppleHelp
              ? "No iPhone, use Safari: Compartilhar > Adicionar à Tela de Início."
              : "Use como app no desktop ou Android, com abertura em tela cheia."}
          </p>
          <div className="mt-3 flex gap-2">
            {installEvent ? (
              <Button
                className="h-10 rounded-xl"
                icon={<Download aria-hidden="true" className="h-4 w-4" />}
                onClick={handleInstall}
                size="sm"
              >
                Instalar app
              </Button>
            ) : null}
            <Button
              className="h-10 rounded-xl"
              onClick={() => setDismissed(true)}
              size="sm"
              variant="ghost"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
