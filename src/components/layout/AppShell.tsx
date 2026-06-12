import { Bell, LogOut, Plus, Search } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { mobileNavigationItems, navigationItems } from "../../app/navigation";
import { useAuth } from "../../context/auth/useAuth";
import { Button } from "../ui";

function getCurrentTitle(pathname: string) {
  return (
    navigationItems.find((item) => item.path === pathname)?.label ??
    "Gestor de Gastos"
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const currentTitle = getCurrentTitle(location.pathname);

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-black/20 px-4 py-5 backdrop-blur-2xl lg:block">
          <div className="mb-7 flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-zinc-950 shadow-soft">
              <span className="text-lg font-bold">G</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Gestor de Gastos</p>
              <p className="text-xs text-zinc-400">Finanças pessoais</p>
            </div>
          </div>

          <nav aria-label="Navegação principal" className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-zinc-950 shadow-soft"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white",
                    ].join(" ")
                  }
                  end={item.path === "/"}
                  key={item.path}
                  to={item.path}
                >
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/72 px-4 py-3 backdrop-blur-2xl md:px-8 lg:px-10">
            <div className="flex min-h-12 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-400 lg:hidden">
                  Gestor de Gastos
                </p>
                <h2 className="truncate text-xl font-semibold text-white md:text-2xl">
                  {currentTitle}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Button aria-label="Pesquisar" size="sm" variant="ghost">
                  <Search aria-hidden="true" className="h-5 w-5" />
                </Button>
                <Button aria-label="Notificações" size="sm" variant="ghost">
                  <Bell aria-hidden="true" className="h-5 w-5" />
                </Button>
                <Button aria-label="Sair" onClick={handleSignOut} size="sm" variant="ghost">
                  <LogOut aria-hidden="true" className="h-5 w-5" />
                </Button>
                <Button
                  className="hidden sm:inline-flex"
                  icon={<Plus aria-hidden="true" className="h-4 w-4" />}
                  size="sm"
                >
                  Novo
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pt-7 lg:px-10 lg:pb-10">
            <Outlet />
          </main>

          <nav
            aria-label="Navegação mobile"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/86 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-2xl lg:hidden"
          >
            <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
              {mobileNavigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-medium transition",
                        isActive
                          ? "bg-white/12 text-white"
                          : "text-zinc-500 hover:text-zinc-200",
                      ].join(" ")
                    }
                    end={item.path === "/"}
                    key={item.label}
                    to={item.path}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" />
                    <span className="max-w-full truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
