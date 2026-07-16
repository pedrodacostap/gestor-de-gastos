import {
  BadgeDollarSign,
  CalendarDays,
  CreditCard,
  Gauge,
  Landmark,
  ListChecks,
  ReceiptText,
  Settings,
  ShieldAlert,
  Target,
  WalletCards,
} from "lucide-react";

export const navigationItems = [
  {
    description: "Visão executiva das suas finanças.",
    icon: Gauge,
    label: "Dashboard",
    path: "/",
  },
  {
    description: "Entradas e saídas organizadas.",
    icon: ReceiptText,
    label: "Transações",
    path: "/transacoes",
  },
  {
    description: "Contas bancárias e carteiras.",
    icon: Landmark,
    label: "Contas",
    path: "/contas",
  },
  {
    description: "Cartões, faturas e limites.",
    icon: CreditCard,
    label: "Cartões",
    path: "/cartoes",
  },
  {
    description: "Objetivos e progresso.",
    icon: Target,
    label: "Metas",
    path: "/metas",
  },
  {
    description: "Compromissos em aberto.",
    icon: ShieldAlert,
    label: "Dívidas",
    path: "/dividas",
  },
  {
    description: "Agenda financeira mensal.",
    icon: CalendarDays,
    label: "Calendário",
    path: "/calendario",
  },
  {
    description: "Recorrências e serviços.",
    icon: WalletCards,
    label: "Assinaturas",
    path: "/assinaturas",
  },
  {
    description: "Limites por categoria.",
    icon: BadgeDollarSign,
    label: "Orçamentos",
    path: "/orcamentos",
  },
  {
    description: "Preferências do aplicativo.",
    icon: Settings,
    label: "Configurações",
    path: "/configuracoes",
  },
] as const;

export const mobileNavigationItems = [
  navigationItems[0],
  navigationItems[1],
  navigationItems[2],
  navigationItems[4],
  {
    description: "Mais áreas do app.",
    icon: ListChecks,
    label: "Mais",
    path: "/mais",
  },
];
