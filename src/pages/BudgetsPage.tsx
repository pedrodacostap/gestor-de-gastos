import { BadgeDollarSign } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function BudgetsPage() {
  return (
    <PlaceholderPage
      description="Defina limites por categoria e acompanhe o consumo mensal com clareza."
      emptyDescription="Os orçamentos ainda não possuem regras. A página já está pronta para receber os componentes futuros."
      icon={BadgeDollarSign}
      title="Orçamentos"
    />
  );
}
