import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { documentsApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const extStyles: Record<string, string> = {
  PDF: "bg-blue-100 text-blue-700",
  XLS: "bg-emerald-100 text-emerald-700",
  DOC: "bg-indigo-100 text-indigo-700",
  IMG: "bg-amber-100 text-amber-700",
};

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

function Dashboard() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents", { q: debounced }],
    queryFn: () => documentsApi.list({ q: debounced || undefined }),
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });

  const rows = useMemo(() => docs, [docs]);

  return (
    <AppShell
      primaryAction={{ label: "New Document", to: "/upload" }}
      searchValue={q}
      onSearchChange={setQ}
    >
      <div className="p-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-semibold mb-2">Recent Documents</h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${rows.length} file${rows.length === 1 ? "" : "s"} ${isAdmin ? "visible to you in the vault" : "owned by you in your vault"}.`}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Visible documents</p>
            <p className="mt-2 text-2xl font-semibold">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Access mode</p>
            <p className="mt-2 text-2xl font-semibold">{isAdmin ? "Admin" : "Personal"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vault scope</p>
            <p className="mt-2 text-lg font-semibold">{isAdmin ? "All users" : "Your own files"}</p>
          </div>
        </div>

        <div className="bg-background ring-1 ring-border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["Document Name", "Type", "Size", "Owner", "Updated", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const ext = (r.metadata.extension ?? "DOC").toUpperCase();
                return (
                  <tr key={r.doc_id} className="hover:bg-secondary/60 transition-colors">
                    <td className="px-6 py-4">
                      <Link to="/documents/$id" params={{ id: r.doc_id }} className="flex items-center gap-3">
                        <div className={`size-8 rounded-lg grid place-items-center text-[10px] font-bold ${extStyles[ext] ?? "bg-secondary text-foreground/70"}`}>
                          {ext}
                        </div>
                        <span className="text-sm font-medium">{r.title}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{ext}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatSize(r.metadata.size_bytes)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-5 bg-input rounded-full" />
                        <span className="text-xs text-foreground/80">{r.owner_name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(r.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${r.title}?`)) del.mutate(r.doc_id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="size-4 inline" />
                      </button>
                      <button className="text-muted-foreground hover:text-foreground ml-2">
                        <MoreHorizontal className="size-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    {debounced ? `No documents match "${debounced}".` : "No recent documents yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
