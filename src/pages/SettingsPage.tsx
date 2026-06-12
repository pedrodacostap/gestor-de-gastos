import { Settings } from "lucide-react";
import { Card, Input, Select } from "../components/ui";
import { PageFrame } from "../components/layout/PageFrame";

export function SettingsPage() {
  return (
    <PageFrame
      description="Preferências visuais e operacionais preparadas para as próximas configurações do aplicativo."
      title="Configurações"
    >
      <Card className="max-w-2xl" tone="elevated">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
            <Settings aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Aparencia</h2>
            <p className="text-sm text-zinc-400">Campos demonstrativos, sem persistência.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome do perfil" placeholder="Gestor de Gastos" />
          <Select
            label="Tema"
            options={[
              { label: "Dark mode", value: "dark" },
              { label: "Light mode", value: "light" },
              { label: "Sistema", value: "system" },
            ]}
          />
        </div>
      </Card>
    </PageFrame>
  );
}
