import { Landmark } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function AccountsPage() {
  return (
    <PlaceholderPage
      description="Organize contas bancárias, carteiras e saldos de forma centralizada."
      emptyDescription="Nenhuma conta foi cadastrada porque esta sprint entrega apenas navegação e design system."
      icon={Landmark}
      title="Contas"
    />
  );
}
