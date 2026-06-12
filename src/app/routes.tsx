import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute";
import { AppShell } from "../components/layout/AppShell";
import { AccountsPage } from "../pages/AccountsPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { SignUpPage } from "../pages/auth/SignUpPage";
import { BudgetsPage } from "../pages/BudgetsPage";
import { CalendarPage } from "../pages/CalendarPage";
import { CardsPage } from "../pages/CardsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DebtsPage } from "../pages/DebtsPage";
import { GoalsPage } from "../pages/GoalsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SubscriptionsPage } from "../pages/SubscriptionsPage";
import { TransactionsPage } from "../pages/TransactionsPage";

export function AppRoutes() {
  return (
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
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
