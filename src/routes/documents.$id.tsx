import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Download, Pencil, Trash2, FolderInput } from "lucide-react";
import { documentsApi, permissionsApi, sharingApi, apiErrorMessage } from "@/lib/api";
import type { AccessType } from "@/lib/api";

export const Route = createFileRoute("/documents/$id")({
  component: DocumentDetail,
});

function DocumentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();

  const { data: doc } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsApi.get(id),
  });
  const { data: perms = [] } = useQuery({
    queryKey: ["permissions", id],
    queryFn: () => permissionsApi.listForDocument(id),
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["sharing-requests", id],
    queryFn: () => sharingApi.listPending({ doc_id: id }),
  });
  const { data: audit = [] } = useQuery({
    queryKey: ["audit", id],
    queryFn: () => documentsApi.auditLog(id),
  });

  const rename = useMutation({
    mutationFn: (title: string) => documentsApi.rename(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document", id] }),
  });
  const remove = useMutation({
    mutationFn: () => documentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      navigate({ to: "/" });
    },
  });
  const updatePerm = useMutation({
    mutationFn: ({ pid, role }: { pid: string; role: AccessType }) => permissionsApi.update(pid, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permissions", id] }),
  });
  const approve = useMutation({
    mutationFn: (rid: string) => sharingApi.approve(rid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sharing-requests", id] });
      qc.invalidateQueries({ queryKey: ["permissions", id] });
    },
  });
  const reject = useMutation({
    mutationFn: (rid: string) => sharingApi.reject(rid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sharing-requests", id] }),
  });

  async function download() {
    if (!doc) return;
    try {
      const blob = await documentsApi.download(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.title;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  if (!doc) {
    return (
      <AppShell>
        <div className="p-12 text-sm text-muted-foreground">Loading document…</div>
      </AppShell>
    );
  }

  const ext = (doc.metadata.extension ?? "DOC").toUpperCase();
  const canModifyDocument = !isAdmin;
  const canDeleteDocument = !!user && (isAdmin || doc.owner_id === user.user_id);
  const sizeLabel =
    doc.metadata.size_bytes && doc.metadata.size_bytes > 1_000_000
      ? `${(doc.metadata.size_bytes / 1_000_000).toFixed(1)} MB`
      : `${Math.round((doc.metadata.size_bytes ?? 0) / 1000)} KB`;

  return (
    <AppShell>
      <section className="py-12 px-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="size-12 bg-blue-100 text-blue-700 rounded-xl grid place-items-center font-bold">
                {ext}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold tracking-tight">{doc.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Updated {new Date(doc.updated_at).toLocaleDateString()} • {sizeLabel} • {doc.metadata.mime_type ?? "file"}
                </p>
              </div>
              <div className="flex gap-2">
                <IconBtn icon={Download} label="Download" onClick={download} />
                {canModifyDocument && (
                  <>
                    <IconBtn
                      icon={Pencil}
                      label="Rename"
                      onClick={() => {
                        const next = prompt("New title", doc.title);
                        if (next && next !== doc.title) rename.mutate(next);
                      }}
                    />
                    <IconBtn icon={FolderInput} label="Move" onClick={() => alert("Move dialog stub")} />
                  </>
                )}
                {canDeleteDocument && (
                  <IconBtn
                    icon={Trash2}
                    label="Delete"
                    destructive
                    onClick={() => {
                      if (confirm(`Delete ${doc.title}?`)) remove.mutate();
                    }}
                  />
                )}
              </div>
            </div>

            <div className="w-full aspect-[3/4] max-w-2xl bg-secondary ring-1 ring-border rounded-xl grid place-items-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Document Preview
              </span>
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-6">
            <div className="p-6 bg-secondary ring-1 ring-border rounded-2xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Sharing & Access
              </h3>
              <div className="space-y-4">
                {perms.map((p) => (
                  <PermRow
                    key={p.perm_id}
                    name={p.user_name ?? "Unknown"}
                    email={p.user_email ?? ""}
                    role={p.access_type}
                    locked={p.access_type === "OWNER"}
                    onChange={(role) => updatePerm.mutate({ pid: p.perm_id, role })}
                  />
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Access Requests
                </h4>
                {requests.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">No pending requests.</p>
                )}
                {requests.map((r) => (
                  <div
                    key={r.request_id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg ring-1 ring-border"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-6 bg-amber-100 text-amber-700 rounded-full text-[8px] grid place-items-center font-bold">
                        {r.requester_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium">{r.requester_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve.mutate(r.request_id)}
                        className="text-[10px] font-semibold text-primary-strong px-2 py-1 hover:underline"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reject.mutate(r.request_id)}
                        className="text-[10px] font-semibold text-destructive px-2 py-1 hover:underline"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-foreground text-background rounded-2xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-background/60 mb-3">
                Audit Log
              </h3>
              <ul className="text-[11px] space-y-3">
                {audit.map((l) => (
                  <li key={l.log_id} className="flex justify-between">
                    <span className="text-background/60">
                      {l.action.toLowerCase().replace("_", " ")} — {l.actor_name}
                    </span>
                    <span>{new Date(l.occurred_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function IconBtn({
  icon: Icon,
  label,
  destructive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  destructive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`size-9 grid place-items-center rounded-lg ring-1 ring-border bg-background hover:bg-secondary transition ${
        destructive ? "text-destructive" : "text-foreground/70"
      }`}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </button>
  );
}

function PermRow({
  name,
  email,
  role,
  locked,
  onChange,
}: {
  name: string;
  email: string;
  role: AccessType;
  locked?: boolean;
  onChange?: (role: AccessType) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-8 bg-input rounded-full" />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-[10px] text-muted-foreground">{email}</p>
        </div>
      </div>
      {locked ? (
        <span className="text-[10px] font-semibold bg-input px-2 py-0.5 rounded uppercase">{role}</span>
      ) : (
        <select
          value={role}
          onChange={(e) => onChange?.(e.target.value as AccessType)}
          className="text-[10px] font-semibold bg-background ring-1 ring-border px-2 py-0.5 rounded uppercase"
        >
          <option value="EDITOR">EDITOR</option>
          <option value="VIEWER">VIEWER</option>
        </select>
      )}
    </div>
  );
}
