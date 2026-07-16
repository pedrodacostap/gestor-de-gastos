import { LogOut, Save, Settings } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SupabaseDiagnostics } from "../components/diagnostics/SupabaseDiagnostics";
import { Button, Card, Select } from "../components/ui";
import { PageFrame } from "../components/layout/PageFrame";
import { useAuth } from "../context/auth/useAuth";

type Preferences = {
  currency: string;
};

const storageKey = "gestor-de-gastos:preferences";
const defaultPreferences: Preferences = {
  currency: "BRL",
};

function loadPreferences() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved
      ? ({ ...defaultPreferences, ...JSON.parse(saved) } as Preferences)
      : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [form, setForm] = useState<Preferences>(loadPreferences);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(storageKey, JSON.stringify(form));
    setMessage("Preferências salvas com sucesso.");
  }

  async function handleLogout() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao sair da conta.");
    }
  }

  return (
    <PageFrame
      description="Preferências básicas do app, sessão e diagnóstico de conexão."
      title="Configurações"
    >
      {message && (
        <p className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100" role="status">
          {message}
        </p>
      )}

      <Card className="max-w-2xl" tone="elevated">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white">
            <Settings aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Preferências</h2>
            <p className="text-sm text-zinc-400">{user?.email ?? "Conta conectada"}</p>
          </div>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Select
            label="Moeda"
            onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
            options={[
              { label: "Real brasileiro (BRL)", value: "BRL" },
              { label: "Dólar americano (USD)", value: "USD" },
              { label: "Euro (EUR)", value: "EUR" },
            ]}
            value={form.currency}
          />
          <div className="flex items-end">
            <Button icon={<Save className="h-4 w-4" />} isFullWidth type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </Card>

      <Card className="max-w-2xl" tone="elevated">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Sessão</h2>
            <p className="mt-1 text-sm text-zinc-400">Saia com segurança deste dispositivo.</p>
          </div>
          <Button icon={<LogOut className="h-4 w-4" />} onClick={handleLogout} variant="secondary">
            Sair
          </Button>
        </div>
      </Card>

      <SupabaseDiagnostics />
    </PageFrame>
  );
}
