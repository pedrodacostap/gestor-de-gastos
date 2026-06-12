import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase/client";
import { Button, Card } from "../ui";

type DiagnosticStatus = "idle" | "ok" | "error";

type DiagnosticItem = {
  details: string;
  label: string;
  status: DiagnosticStatus;
};

type SupabaseErrorLike = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

function formatSupabaseError(error: unknown) {
  if (!error) {
    return "Sem erro.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && "message" in error) {
    const supabaseError = error as SupabaseErrorLike;
    return [
      supabaseError.message,
      supabaseError.details ? `Detalhes: ${supabaseError.details}` : null,
      supabaseError.hint ? `Dica: ${supabaseError.hint}` : null,
      supabaseError.code ? `Código: ${supabaseError.code}` : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return String(error);
}

function resultItem(label: string, error: unknown): DiagnosticItem {
  return {
    details: error ? formatSupabaseError(error) : "Consulta concluída.",
    label,
    status: error ? "error" : "ok",
  };
}

export function SupabaseDiagnostics() {
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  async function runDiagnostics() {
    setIsRunning(true);

    try {
      const sessionResult = await supabase.auth.getSession();
      const userId = sessionResult.data.session?.user.id;

      const nextItems: DiagnosticItem[] = [
        {
          details: isSupabaseConfigured
            ? "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY carregadas."
            : "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
          label: "Configuração Supabase",
          status: isSupabaseConfigured ? "ok" : "error",
        },
        {
          details: userId
            ? `Sessão ativa para user_id ${userId}.`
            : "Nenhuma sessão ativa encontrada.",
          label: "Sessão Auth",
          status: userId ? "ok" : "error",
        },
      ];

      if (userId) {
        const [accounts, categories, transactions] = await Promise.all([
          supabase.from("accounts").select("id,user_id,name").eq("user_id", userId).limit(1),
          supabase
            .from("categories")
            .select("id,user_id,name,type")
            .eq("user_id", userId)
            .limit(1),
          supabase
            .from("transactions")
            .select("id,user_id,account_id,title,type")
            .eq("user_id", userId)
            .limit(1),
        ]);

        nextItems.push(
          resultItem("Tabela accounts", accounts.error),
          resultItem("Tabela categories", categories.error),
          resultItem("Tabela transactions", transactions.error),
        );
      }

      setItems(nextItems);
    } catch (error) {
      setItems([
        {
          details: formatSupabaseError(error),
          label: "Diagnóstico",
          status: "error",
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card className="max-w-2xl" tone="elevated">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Diagnóstico Supabase</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Verifica sessão, conexão e acesso RLS às tabelas financeiras
            principais.
          </p>
        </div>
        <Button
          disabled={isRunning}
          icon={<RefreshCw className={isRunning ? "h-4 w-4 animate-spin" : "h-4 w-4"} />}
          onClick={runDiagnostics}
          variant="secondary"
        >
          Verificar
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {items.map((item) => {
            const isOk = item.status === "ok";

            return (
              <div
                className={[
                  "rounded-lg border p-3 text-sm",
                  isOk
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    : "border-rose-300/20 bg-rose-300/10 text-rose-100",
                ].join(" ")}
                key={item.label}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {isOk ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{item.label}</span>
                </div>
                <p className="mt-1 leading-6 opacity-90">{item.details}</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}
