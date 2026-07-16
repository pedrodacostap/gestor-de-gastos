import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/auth/useAuth";
import { LoadingState } from "../ui";

type PublicOnlyRouteProps = {
  children: ReactNode;
};

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[var(--app-bg)] p-4">
        <LoadingState label="Carregando autenticação" />
      </div>
    );
  }

  if (user) {
    return <Navigate replace to="/" />;
  }

  return children;
}
