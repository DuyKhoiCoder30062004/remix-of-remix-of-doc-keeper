import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { documentsApi, apiErrorMessage, usersApi } from "@/lib/api";
import type { DocumentMeta } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { getDocumentSizeBytes, parseDocumentMetadata } from "@/lib/document-metadata";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const extStyles: Record<string, string> = {
  PDF: "bg-blue-100 text-blue-700",
  XLS: "bg-emerald-100 text-emerald-700",
  DOC: "bg-indigo-100 text-indigo-700",
  IMG: "bg-amber-100 text-amber-700",
};

type SortOrder = "newest" | "oldest";

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

// Supports both snake_case (mock) and camelCase (Spring Boot)
function getDocId(r: DocumentMeta): string {
  const id = r.doc_id ?? r.docId;
  return id == null ? "" : `${id}`;
}

function getOwnerName(r: DocumentMeta): string {
  const ownerName =
    r.owner?.name ??
    r.owner_name ??
    (r as DocumentMeta & { ownerName?: string }).ownerName;

  if (ownerName) return ownerName;

  const ownerId = r.owner_id ?? r.owner?.userId ?? r.owner?.user_id;
  return ownerId != null ? `User #${ownerId}` : "—";
}

function getOwnerId(r: DocumentMeta): number | undefined {
  return r.owner_id ?? r.owner?.userId ?? r.owner?.user_id;
}

// LocalDateTime may serialize as ISO string OR [year,month,day,hour,minute,second] array
function getUpdatedAt(r: DocumentMeta): string {
  const val = r.updatedAt ?? r.updated_at;
  if (!val) return "—";
  if (Array.isArray(val)) {
    const [y, mo, d] = val as number[];
    return new Date(y, mo - 1, d).toLocaleDateString();
  }
  return new Date(val as string).toLocaleDateString();
}

function getUpdatedAtMs(r: DocumentMeta): number {
  const val = r.updatedAt ?? r.updated_at ?? r.createdAt ?? r.created_at;
  if (!val) return 0;
  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = val as number[];
    return new Date(y, mo - 1, d, h, mi, s).getTime();
  }
  const parsed = new Date(val as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getFileType(r: DocumentMeta): string {
  const meta = parseDocumentMetadata(r.metadata);
  const metaExt = typeof meta.extension === "string" ? meta.extension : "";
  if (metaExt) return metaExt.toUpperCase();
  const titleExt = r.title.split(".").pop();
  return titleExt ? titleExt.toUpperCase() : "UNKNOWN";
}

function Dashboard() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
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

  const { data: users = [] } = useQuery({
    queryKey: ["users", "owner-lookup"],
    queryFn: () => usersApi.list(),
    enabled: !!user && isAdmin,
  });

  const del = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });

  const availableFileTypes = useMemo(
    () => Array.from(new Set(docs.map((doc) => getFileType(doc)))).sort(),
    [docs],
  );

  const rows = useMemo(() => {
    const filtered = docs.filter((doc) =>
      fileTypeFilter === "ALL" ? true : getFileType(doc) === fileTypeFilter,
    );

    filtered.sort((a, b) => {
      const diff = getUpdatedAtMs(b) - getUpdatedAtMs(a);
      return sortOrder === "newest" ? diff : -diff;
    });

    return filtered;
  }, [docs, fileTypeFilter, sortOrder]);

  const usersById = useMemo(() => {
    const map = new Map<number, string>();
    users.forEach((u) => map.set(u.user_id, u.name));
    return map;
  }, [users]);

  const resolveOwnerLabel = (r: DocumentMeta) => {
    const fromPayload = getOwnerName(r);
    if (fromPayload !== "—") return fromPayload;

    const ownerId = getOwnerId(r);
    if (ownerId != null && usersById.has(ownerId)) return usersById.get(ownerId) as string;

    if (!isAdmin && ownerId === user?.user_id) return "You";

    return ownerId != null ? `User #${ownerId}` : "—";
  };

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

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">File type</label>
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="ALL">All types</option>
            {availableFileTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="newest">Newest to oldest</option>
            <option value="oldest">Oldest to newest</option>
          </select>
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
                const ext = getFileType(r);
                const docId = getDocId(r);
                return (
                  <tr key={docId} className="hover:bg-secondary/60 transition-colors">
                    <td className="px-6 py-4">
                      <Link to="/documents-id" search={{ id: docId }} className="flex items-center gap-3">
                        <div className={`size-8 rounded-lg grid place-items-center text-[10px] font-bold ${extStyles[ext] ?? "bg-secondary text-foreground/70"}`}>
                          {ext}
                        </div>
                        <span className="text-sm font-medium">{r.title}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{ext}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatSize(getDocumentSizeBytes(r))}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-5 bg-input rounded-full" />
                        <span className="text-xs text-foreground/80">{resolveOwnerLabel(r)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {getUpdatedAt(r)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${r.title}?`)) del.mutate(docId);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="size-4 inline" />
                          </button>
                        </>
                      ) : (
                        <>
                          {(r.owner_id === user?.user_id || r.owner?.userId === Number(user?.user_id)) && (
                            <>
                              <button
                                onClick={() => {
                                  const next = prompt("New title", r.title);
                                  if (next && next !== r.title) {
                                    // TODO: implement rename
                                  }
                                }}
                                className="text-muted-foreground hover:text-foreground mr-2"
                                title="Rename"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ${r.title}?`)) del.mutate(docId);
                                }}
                                className="text-muted-foreground hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="size-4 inline" />
                              </button>
                            </>
                          )}
                        </>
                      )}
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
