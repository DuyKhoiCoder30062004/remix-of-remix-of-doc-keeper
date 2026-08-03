import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FolderPlus, Folder as FolderIcon, Pencil, Trash2, MoveRight, X } from "lucide-react";
import {
  foldersApi,
  documentsApi,
  apiErrorMessage,
  type Folder,
  type DocumentMeta,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { parseDocumentMetadata } from "@/lib/document-metadata";

type SortOrder = "newest" | "oldest";

export const Route = createFileRoute("/folders")({
  component: FoldersPage,
});

function FoldersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const canManageFolders = !isAdmin;
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [moveDoc, setMoveDoc] = useState<DocumentMeta | null>(null);
  const [fileTypeFilter, setFileTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: () => foldersApi.list(),
    enabled: !!user,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", { folder_id: selectedFolderId ?? "__all__" }],
    queryFn: () =>
      selectedFolderId
        ? documentsApi.list({ folder_id: selectedFolderId })
        : documentsApi.list(),
    enabled: !!user,
  });

  const createFolder = useMutation({
    mutationFn: (name: string) => foldersApi.create(name),
    onSuccess: () => {
      setNewName("");
      qc.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: (err) => alert(apiErrorMessage(err)),
  });

  const renameFolder = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => foldersApi.rename(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });

  const deleteFolder = useMutation({
    mutationFn: (id: string) => foldersApi.remove(id),
    onSuccess: () => {
      setSelectedFolderId((cur) => cur);
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err) => alert(apiErrorMessage(err)),
  });

  const moveDocument = useMutation({
    mutationFn: ({ docId, folder_id }: { docId: string; folder_id: string | null }) =>
      documentsApi.move(docId, folder_id),
    onSuccess: () => {
      setMoveDoc(null);
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err) => alert(apiErrorMessage(err)),
  });

  const filteredFolders = useMemo(
    () => folders.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())),
    [folders, q],
  );

  const availableFileTypes = useMemo(
    () => Array.from(new Set(docs.map((d) => getDocumentFileType(d)))).sort(),
    [docs],
  );

  const visibleDocs = useMemo(() => {
    const filtered = docs.filter((doc) =>
      fileTypeFilter === "ALL" ? true : getDocumentFileType(doc) === fileTypeFilter,
    );

    filtered.sort((a, b) => {
      const diff = getDocumentUpdatedAtMs(b) - getDocumentUpdatedAtMs(a);
      return sortOrder === "newest" ? diff : -diff;
    });

    return filtered;
  }, [docs, fileTypeFilter, sortOrder]);

  return (
    <AppShell
      searchPlaceholder="Search folders..."
      searchValue={q}
      onSearchChange={setQ}
    >
      <section className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Folder Management</h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Admin can view vault folders, but can only delete items that belong to other users."
                : "Manage your own folders and documents. Other users remain hidden from your view."}
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2 bg-background ring-1 ring-border rounded-xl p-3">
            <FolderPlus className="size-4 text-muted-foreground ml-2" />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New folder name"
              className="flex-1 bg-transparent text-sm focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) createFolder.mutate(newName.trim());
              }}
            />
            <button
              onClick={() => newName.trim() && createFolder.mutate(newName.trim())}
              disabled={!newName.trim() || createFolder.isPending}
              className="bg-primary text-primary-foreground text-xs font-medium py-1.5 px-3 rounded-lg disabled:opacity-50"
            >
              Add folder
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Folder list */}
          <div className="md:col-span-1 space-y-2">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ring-1 ${
                selectedFolderId === null
                  ? "bg-secondary ring-border"
                  : "bg-background ring-border hover:bg-secondary/40"
              }`}
            >
              {isAdmin ? "All documents" : "My documents"}
            </button>
            {filteredFolders.map((f) => (
              <FolderRow
                key={f.folder_id}
                folder={f}
                active={selectedFolderId === String(f.folder_id)}
                onSelect={() => setSelectedFolderId(String(f.folder_id))}
                canManage={canManageFolders}
                onRename={(name) => renameFolder.mutate({ id: String(f.folder_id), name })}
                onDelete={() => {
                  if (confirm(`Delete folder "${f.name}"? Documents inside will become unfiled.`)) {
                    deleteFolder.mutate(String(f.folder_id));
                  }
                }}
              />
            ))}
            {filteredFolders.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-4">No folders yet.</p>
            )}
          </div>

          {/* Documents pane */}
          <div className="md:col-span-2 bg-background ring-1 ring-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              {selectedFolderId
                ? folders.find((f) => String(f.folder_id) === selectedFolderId)?.name ?? "Folder"
                : isAdmin ? "All documents" : "My documents"}
              <span className="ml-2 normal-case text-muted-foreground/70">
                ({visibleDocs.length})
              </span>
            </div>
            <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">File type</label>
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs"
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
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs"
              >
                <option value="newest">Newest to oldest</option>
                <option value="oldest">Oldest to newest</option>
              </select>
            </div>
            <ul className="divide-y divide-border">
              {visibleDocs.map((d) => (
                <li
                  key={d.doc_id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {d.owner_name ?? "—"} ·{" "}
                      {d.folder_id
                        ? folders.find((f) => f.folder_id === d.folder_id)?.name ?? "Folder"
                        : "Unfiled"}
                    </p>
                  </div>
                  {!isAdmin && (
                    <button
                      onClick={() => setMoveDoc(d)}
                      className="text-xs font-medium py-1.5 px-2.5 rounded-lg ring-1 ring-border hover:bg-secondary flex items-center gap-1.5"
                    >
                      <MoveRight className="size-3.5" />
                      Move
                    </button>
                  )}
                </li>
              ))}
              {visibleDocs.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No documents in this view.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {moveDoc && (
        <MoveDialog
          doc={moveDoc}
          folders={folders}
          onCancel={() => setMoveDoc(null)}
          onMove={(folder_id) => moveDocument.mutate({ docId: String(moveDoc.doc_id), folder_id })}
          pending={moveDocument.isPending}
        />
      )}
    </AppShell>
  );
}

function FolderRow({
  folder,
  active,
  onSelect,
  canManage,
  onRename,
  onDelete,
}: {
  folder: Folder;
  active: boolean;
  onSelect: () => void;
  canManage: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(folder.name);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ring-1 ${
        active ? "bg-secondary ring-border" : "bg-background ring-border hover:bg-secondary/40"
      }`}
    >
      <FolderIcon className="size-4 text-muted-foreground shrink-0" />
      {editing ? (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft.trim() && draft !== folder.name) onRename(draft.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setDraft(folder.name);
              setEditing(false);
            }
          }}
          autoFocus
          className="flex-1 bg-transparent focus:outline-none"
        />
      ) : (
        <button onClick={onSelect} className="flex-1 text-left truncate">
          {folder.name}
        </button>
      )}
      {canManage && (
        <button
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground"
          title="Rename"
        >
          <Pencil className="size-3.5" />
        </button>
      )}
      <button
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive"
        title="Delete"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function MoveDialog({
  doc,
  folders,
  onCancel,
  onMove,
  pending,
}: {
  doc: DocumentMeta;
  folders: Folder[];
  onCancel: () => void;
  onMove: (folder_id: string | null) => void;
  pending: boolean;
}) {
  const [target, setTarget] = useState<string | null>(
    doc.folder_id == null ? null : String(doc.folder_id),
  );

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="bg-background rounded-xl ring-1 ring-border w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Move document</h3>
            <p className="text-xs text-muted-foreground truncate">{doc.title}</p>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-1 max-h-64 overflow-auto">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer">
            <input
              type="radio"
              checked={target === null}
              onChange={() => setTarget(null)}
            />
            <span className="text-sm">Unfiled (no folder)</span>
          </label>
          {folders.map((f) => (
            <label
              key={f.folder_id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer"
            >
              <input
                type="radio"
                checked={target === String(f.folder_id)}
                onChange={() => setTarget(String(f.folder_id))}
              />
              <FolderIcon className="size-4 text-muted-foreground" />
              <span className="text-sm">{f.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="text-xs font-medium py-1.5 px-3 rounded-lg ring-1 ring-border hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onMove(target)}
            disabled={pending}
            className="bg-primary text-primary-foreground text-xs font-medium py-1.5 px-3 rounded-lg disabled:opacity-50"
          >
            {pending ? "Moving…" : "Move here"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getDocumentFileType(doc: DocumentMeta): string {
  const meta = parseDocumentMetadata(doc.metadata);
  const metaExt = typeof meta.extension === "string" ? meta.extension : "";
  if (metaExt) return metaExt.toUpperCase();
  const titleExt = doc.title.split(".").pop();
  return titleExt ? titleExt.toUpperCase() : "UNKNOWN";
}

function getDocumentUpdatedAtMs(doc: DocumentMeta): number {
  const val = doc.updatedAt ?? doc.updated_at ?? doc.createdAt ?? doc.created_at;
  if (!val) return 0;

  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = val as number[];
    return new Date(y, mo - 1, d, h, mi, s).getTime();
  }

  const parsed = new Date(val as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
