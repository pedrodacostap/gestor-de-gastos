import { Repeat } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function SubscriptionsPage() {
  return (
    <PlaceholderPage
      description="Centralize assinaturas, recorrências e serviços cobrados periodicamente."
      emptyDescription="Nenhuma assinatura foi criada. Esta sprint entrega somente a superfície visual."
      icon={Repeat}
      title="Assinaturas"
    />
  );
}
