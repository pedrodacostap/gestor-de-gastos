import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { PageFrame } from "../components/layout/PageFrame";
import { Button, EmptyState } from "../components/ui";

type PlaceholderPageProps = {
  description: string;
  emptyDescription: string;
  icon: LucideIcon;
  title: string;
};

export function PlaceholderPage({
  description,
  emptyDescription,
  icon: Icon,
  title,
}: PlaceholderPageProps) {
  return (
    <PageFrame
      actions={<Button icon={<Plus className="h-4 w-4" />}>Adicionar</Button>}
      description={description}
      title={title}
    >
      <EmptyState
        description={emptyDescription}
        icon={<Icon aria-hidden="true" className="h-6 w-6" />}
        title={`${title} sem dados`}
      />
    </PageFrame>
  );
}
