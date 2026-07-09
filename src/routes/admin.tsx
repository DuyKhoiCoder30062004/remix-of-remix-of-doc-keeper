import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
});

const users = [
  { name: "Marcus Thorne", email: "m.thorne@firm.com", role: "Global Admin" },
  { name: "Sarah Jenkins", email: "sarah@firm.com", role: "Department Manager" },
  { name: "Elena Rodriguez", email: "e.rod@firm.com", role: "Department Manager" },
  { name: "David Chen", email: "d.chen@firm.com", role: "Standard User" },
  { name: "Priya Nair", email: "p.nair@firm.com", role: "Standard User" },
];

function AdminPanel() {
  return (
    <AppShell searchPlaceholder="Search users...">
      <section className="py-12 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-semibold">User Governance</h2>
              <p className="text-sm text-muted-foreground">
                Manage institutional roles and access levels.
              </p>
            </div>
            <button className="bg-background text-foreground text-xs font-medium py-1.5 px-3 rounded-lg ring-1 ring-border hover:bg-secondary transition">
              Export logs
            </button>
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.email}
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
                      defaultValue={u.role}
                      className="text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
                    >
                      <option>Global Admin</option>
                      <option>Department Manager</option>
                      <option>Standard User</option>
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