import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Download, Pencil, Trash2, FolderInput, Share2 } from "lucide-react";
import { documentsApi, permissionsApi, sharingApi, apiErrorMessage, usersApi } from "@/lib/api";
import type { AccessType } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { getDocumentSizeBytes, parseDocumentMetadata } from "@/lib/document-metadata";

function normalizeAccessType(value: unknown): AccessType {
  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  if (normalized === "OWNER" || normalized === "EDITOR" || normalized === "VIEWER") {
    return normalized;
  }
  return "VIEWER";
}

function getDocOwnerId(doc: any): number | null {
  const ownerId =
    doc?.owner_id ??
    doc?.ownerId ??
    doc?.owner?.user_id ??
    doc?.owner?.userId;
  const parsed = Number(ownerId);
  return Number.isFinite(parsed) ? parsed : null;
}

function getUserInitials(name?: string): string {
  return (name?.slice(0, 2) ?? "??").toUpperCase();
}

function formatAuditDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

function formatAuditAction(value: unknown): string {
  if (typeof value !== "string" || !value) return "activity";
  return value.toLowerCase().replaceAll("_", " ");
}

export const Route = createFileRoute("/documents-id")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: DocumentDetail,
});

function DocumentDetail() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [showShareDialog, setShowShareDialog] = useState(false);

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
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
    enabled: showShareDialog,
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
    onError: (err) => alert(apiErrorMessage(err)),
  });
  const revokePerm = useMutation({
    mutationFn: (pid: string) => permissionsApi.revoke(pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permissions", id] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });
  const approve = useMutation({
    mutationFn: (rid: string) => sharingApi.approve(rid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sharing-requests", id] });
      qc.invalidateQueries({ queryKey: ["permissions", id] });
    },
    onError: (err) => alert(apiErrorMessage(err)),
  });
  const reject = useMutation({
    mutationFn: (rid: string) => sharingApi.reject(rid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sharing-requests", id] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });
  const share = useMutation({
    mutationFn: ({ user_id, permission }: { user_id: string; permission: AccessType }) =>
      sharingApi.request({ doc_id: id, user_id, permission }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sharing-requests", id] });
      setShowShareDialog(false);
    },
    onError: (err) => alert(apiErrorMessage(err)),
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

  const metadata = parseDocumentMetadata(doc.metadata);
  const ext = ((metadata.extension as string | undefined) ?? "DOC").toUpperCase();
  const currentUserId = Number(user?.user_id ?? 0);
  const ownerId = getDocOwnerId(doc);
  const isOwner = ownerId != null && ownerId === currentUserId;
  const myPermission = perms.find((p) => Number(p.user_id) === currentUserId);
  const myRole: AccessType = isOwner ? "OWNER" : normalizeAccessType(myPermission?.access_type);
  const hasExplicitOwnershipSignals = ownerId != null || perms.length > 0;

  const canRenameDocument = myRole === "OWNER" || myRole === "EDITOR";
  // If backend omits owner/permission info, keep Share visible for signed-in non-admin users.
  const canShareDocument =
    isAdmin || myRole === "OWNER" || (!!user && !isAdmin && !hasExplicitOwnershipSignals);
  const canMoveDocument = myRole === "OWNER";
  const canManagePermissions = myRole === "OWNER";
  const canDeleteDocument = !!user && (isAdmin || myRole === "OWNER");
  const docSizeBytes = getDocumentSizeBytes(doc);
  const updatedAtRaw = typeof doc.updated_at === "string" ? doc.updated_at : "";
  const updatedDateLabel = updatedAtRaw ? new Date(updatedAtRaw).toLocaleDateString() : "—";
  const sizeLabel =
    docSizeBytes && docSizeBytes > 1_000_000
      ? `${(docSizeBytes / 1_000_000).toFixed(1)} MB`
      : `${Math.round((docSizeBytes ?? 0) / 1000)} KB`;

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
                  Updated {updatedDateLabel} • {sizeLabel} • {(metadata.mime_type as string | undefined) ?? "file"}
                </p>
              </div>
              <div className="flex gap-2">
                <IconBtn icon={Download} label="Download" onClick={download} />
                {canRenameDocument && (
                  <>
                    <IconBtn
                      icon={Pencil}
                      label="Rename"
                      onClick={() => {
                        const next = prompt("New title", doc.title);
                        if (next && next !== doc.title) rename.mutate(next);
                      }}
                    />
                    {canMoveDocument && (
                      <IconBtn icon={FolderInput} label="Move" onClick={() => alert("Move dialog stub")} />
                    )}
                    {canShareDocument && (
                      <IconBtn icon={Share2} label="Share" onClick={() => setShowShareDialog(true)} />
                    )}
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

            <div className="w-full aspect-3/4 max-w-2xl bg-secondary ring-1 ring-border rounded-xl grid place-items-center">
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
                    key={String(p.perm_id)}
                    name={p.user_name ?? "Unknown"}
                    email={p.user_email ?? ""}
                    role={normalizeAccessType(p.access_type)}
                    locked={
                      normalizeAccessType(p.access_type) === "OWNER" || !canManagePermissions
                    }
                    onChange={
                      canManagePermissions
                        ? (role) => updatePerm.mutate({ pid: String(p.perm_id), role })
                        : undefined
                    }
                    onRevoke={
                      canManagePermissions
                        ? () => revokePerm.mutate(String(p.perm_id))
                        : undefined
                    }
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
                    key={String(r.request_id)}
                    className="flex items-center justify-between p-3 bg-background rounded-lg ring-1 ring-border"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-6 bg-amber-100 text-amber-700 rounded-full text-[8px] grid place-items-center font-bold">
                        {getUserInitials(r.requester_name)}
                      </div>
                      <span className="text-xs font-medium">{r.requester_name ?? "Unknown requester"}</span>
                    </div>
                    <div className="flex gap-2">
                      {Number(r.requester_id) === currentUserId ? (
                        <>
                          <button
                            onClick={() => approve.mutate(String(r.request_id))}
                            className="text-[10px] font-semibold text-primary-strong px-2 py-1 hover:underline"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => reject.mutate(String(r.request_id))}
                            className="text-[10px] font-semibold text-destructive px-2 py-1 hover:underline"
                          >
                            Deny
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Pending recipient action</span>
                      )}
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
                {audit.map((l, idx) => {
                  const logId = typeof l?.log_id === "string" || typeof l?.log_id === "number"
                    ? String(l.log_id)
                    : `audit-${idx}`;
                  const actor = typeof l?.actor_name === "string" ? l.actor_name : "system";
                  return (
                  <li key={logId} className="flex justify-between">
                    <span className="text-background/60">
                      {formatAuditAction(l?.action ?? l)} — {actor}
                    </span>
                    <span>{formatAuditDate(l?.occurred_at)}</span>
                  </li>
                )})}
              </ul>
            </div>
          </div>
        </div>
      </section>
      {showShareDialog && (
        <ShareDialog
          doc={doc}
          allUsers={allUsers}
          currentUser={user}
          onShare={(userId, permission) => share.mutate({ user_id: userId, permission })}
          onClose={() => setShowShareDialog(false)}
          isLoading={share.isPending}
        />
      )}
    </AppShell>
  );
}

function ShareDialog({
  doc,
  allUsers,
  currentUser,
  onShare,
  onClose,
  isLoading,
}: {
  doc: any;
  allUsers: any[];
  currentUser: any;
  onShare: (userId: string, permission: AccessType) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [selectedUser, setSelectedUser] = useState("");
  const [permission, setPermission] = useState<AccessType>("EDITOR");

  const availableUsers = allUsers.filter((u) => u.user_id !== currentUser?.user_id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Share "{doc.title}"</h2>
          <p className="text-sm text-muted-foreground mt-1">Send a sharing request to another user</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="">Select a user…</option>
              {availableUsers.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Permission Level</label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as AccessType)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="EDITOR">Editor (can edit)</option>
              <option value="VIEWER">Viewer (read-only)</option>
            </select>
          </div>
        </div>
        <div className="p-6 border-t border-border flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedUser && onShare(selectedUser, permission)}
            disabled={!selectedUser || isLoading}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
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
  onRevoke,
}: {
  name: string;
  email: string;
  role: AccessType;
  locked?: boolean;
  onChange?: (role: AccessType) => void;
  onRevoke?: () => void;
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
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => onChange?.(e.target.value as AccessType)}
            className="text-[10px] font-semibold bg-background ring-1 ring-border px-2 py-0.5 rounded uppercase"
          >
            <option value="EDITOR">EDITOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          {onRevoke && (
            <button
              onClick={onRevoke}
              className="text-[10px] font-semibold text-destructive hover:underline"
            >
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  );
}
