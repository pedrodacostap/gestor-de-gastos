import { ShieldAlert } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function DebtsPage() {
  return (
    <PlaceholderPage
      description="Visualize dívidas, parcelas, taxas e compromissos em aberto."
      emptyDescription="A área de dívidas está reservada para a modelagem financeira das próximas sprints."
      icon={ShieldAlert}
      title="Dívidas"
    />
  );
}
