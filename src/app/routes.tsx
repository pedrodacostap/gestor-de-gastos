import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute";
import { AppShell } from "../components/layout/AppShell";
import { LoadingState } from "../components/ui";

const AccountsPage = lazy(() =>
  import("../pages/AccountsPage").then((module) => ({
    default: module.AccountsPage,
  })),
);
const BudgetsPage = lazy(() =>
  import("../pages/BudgetsPage").then((module) => ({
    default: module.BudgetsPage,
  })),
);
const CalendarPage = lazy(() =>
  import("../pages/CalendarPage").then((module) => ({
    default: module.CalendarPage,
  })),
);
const CardsPage = lazy(() =>
  import("../pages/CardsPage").then((module) => ({
    default: module.CardsPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const DebtsPage = lazy(() =>
  import("../pages/DebtsPage").then((module) => ({
    default: module.DebtsPage,
  })),
);
const GoalsPage = lazy(() =>
  import("../pages/GoalsPage").then((module) => ({
    default: module.GoalsPage,
  })),
);
const LoginPage = lazy(() =>
  import("../pages/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const MorePage = lazy(() =>
  import("../pages/MorePage").then((module) => ({
    default: module.MorePage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../pages/auth/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const SignUpPage = lazy(() =>
  import("../pages/auth/SignUpPage").then((module) => ({
    default: module.SignUpPage,
  })),
);
const SubscriptionsPage = lazy(() =>
  import("../pages/SubscriptionsPage").then((module) => ({
    default: module.SubscriptionsPage,
  })),
);
const TransactionsPage = lazy(() =>
  import("../pages/TransactionsPage").then((module) => ({
    default: module.TransactionsPage,
  })),
);

function RouteFallback() {
  return (
    <div className="min-h-dvh bg-[var(--app-bg)] p-4 text-white md:p-8">
      <LoadingState label="Carregando tela" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="cadastro"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="recuperar-senha"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="transacoes" element={<TransactionsPage />} />
          <Route path="contas" element={<AccountsPage />} />
          <Route path="cartoes" element={<CardsPage />} />
          <Route path="metas" element={<GoalsPage />} />
          <Route path="dividas" element={<DebtsPage />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="assinaturas" element={<SubscriptionsPage />} />
          <Route path="orcamentos" element={<BudgetsPage />} />
          <Route path="mais" element={<MorePage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Suspense>
  );
}
