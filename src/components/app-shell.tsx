import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutGrid, Upload, FolderTree, Shield, Search, Plus, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/folders", label: "Folders", icon: FolderTree },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/admin", label: "Admin Panel", icon: Shield, adminOnly: true },
] as const;

export function AppShell({
  children,
  searchPlaceholder = "Search archives...",
  primaryAction,
  searchValue,
  onSearchChange,
}: {
  children: ReactNode;
  searchPlaceholder?: string;
  primaryAction?: { label: string; to: string };
  searchValue?: string;
  onSearchChange?: (v: string) => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-secondary text-foreground">
      <aside className="w-64 border-r border-border bg-background flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="size-8 bg-foreground rounded-md grid place-items-center text-background text-xs font-semibold">
            V
          </div>
          <span className="font-semibold tracking-tight">VaultSystem</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {nav
            .filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin)
            .map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <div className="size-8 bg-input rounded-full shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{user?.name ?? "Guest"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                {user?.role ?? "—"}
              </p>
            </div>
            {user && (
              <button
                onClick={async () => {
                  await logout();
                  navigate({ to: "/auth" });
                }}
                title="Sign out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-background/50 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-9 pr-3 bg-secondary border-none rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {primaryAction && (
            <Link
              to={primaryAction.to}
              className="bg-primary text-primary-foreground text-sm font-medium py-1.5 pl-2 pr-3 flex items-center gap-2 rounded-lg hover:brightness-105 transition"
            >
              <Plus className="size-4" strokeWidth={2} />
              {primaryAction.label}
            </Link>
          )}
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
