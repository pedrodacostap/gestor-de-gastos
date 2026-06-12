import { CreditCard } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function CardsPage() {
  return (
    <PlaceholderPage
      description="Prepare a experiência para cartões, limites, vencimentos e faturas."
      emptyDescription="A área de cartões está navegável e pronta para receber regras de fatura depois."
      icon={CreditCard}
      title="Cartões"
    />
  );
}
