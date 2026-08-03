import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MoreHorizontal } from "lucide-react";
import { usersApi, apiErrorMessage } from "@/lib/api";
import type { Role } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
});

function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin, navigate]);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
    enabled: isAdmin,
  });

  const filteredUsers = useMemo(() => {
    const needle = q.toLowerCase();
    return users.filter(
      (u) =>
        !needle ||
        u.name.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle)
    );
  }, [users, q]);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const userCount = users.filter((u) => u.role === "USER").length;

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => usersApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });

  async function exportLogs() {
    try {
      const blob = await usersApi.exportAuditLogs();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit-log.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  return (
    <AppShell 
      searchPlaceholder="Search users..."
      searchValue={q}
      onSearchChange={setQ}
    >
      <section className="py-12 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-semibold">User Governance</h2>
              <p className="text-sm text-muted-foreground">
                Manage institutional roles and access levels.
              </p>
            </div>
            <button
              onClick={exportLogs}
              className="bg-background text-foreground text-xs font-medium py-1.5 px-3 rounded-lg ring-1 ring-border hover:bg-secondary transition"
            >
              Export logs
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total accounts</p>
              <p className="mt-2 text-2xl font-semibold">{users.length}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Admins</p>
              <p className="mt-2 text-2xl font-semibold">{adminCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Regular users</p>
              <p className="mt-2 text-2xl font-semibold">{userCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
            Admins can delete documents and folders, but they cannot rename or move files that belong to other users.
          </div>

          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between p-4 bg-background ring-1 ring-border rounded-xl hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-input rounded-full" />
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Role</p>
                    <select
                      value={u.role}
                      onChange={(e) => updateRole.mutate({ id: u.user_id, role: e.target.value as Role })}
                      className="text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="USER">USER</option>
                    </select>
                  </div>
                  <button className="size-8 bg-secondary rounded-lg text-muted-foreground grid place-items-center hover:text-foreground transition">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
