import { Target } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function GoalsPage() {
  return (
    <PlaceholderPage
      description="Acompanhe objetivos financeiros com progresso e prioridades visuais."
      emptyDescription="As metas ainda não possuem persistência. A tela está pronta para receber os fluxos futuros."
      icon={Target}
      title="Metas"
    />
  );
}
