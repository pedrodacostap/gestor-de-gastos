import { CalendarDays } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function CalendarPage() {
  return (
    <PlaceholderPage
      description="Planeje vencimentos, recebimentos e eventos financeiros no calendário."
      emptyDescription="A visualização de calendário ainda não possui eventos. A navegação já está preparada."
      icon={CalendarDays}
      title="Calendário"
    />
  );
}
