import { ReceiptText } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function TransactionsPage() {
  return (
    <PlaceholderPage
      description="Liste entradas, saídas e transferências com filtros claros quando a camada de dados existir."
      emptyDescription="A estrutura visual para transações está pronta. O cadastro real entra em uma sprint futura."
      icon={ReceiptText}
      title="Transações"
    />
  );
}
