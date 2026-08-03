import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { sharingApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/sharing-requests")({
  component: SharingRequestsPage,
});

function SharingRequestsPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [documentSearch, setDocumentSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: requests = [] } = useQuery({
    queryKey: ["all-sharing-requests"],
    queryFn: () => sharingApi.listPending(),
    enabled: !!user,
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["sharing-requests-log"],
    queryFn: () => sharingApi.listAll(),
    enabled: isAdmin,
  });

  // Backend already scopes incoming requests for non-admin users.
  const myIncomingRequests = requests;

  const filteredLogRequests = useMemo(() => {
    const needle = documentSearch.trim().toLowerCase();
    if (!needle) return allRequests;
    return allRequests.filter((req) => {
      const docTitle = (req.document_title ?? "").toLowerCase();
      const folderName = (req.folder_name ?? "").toLowerCase();
      const docId = String(req.doc_id ?? "").toLowerCase();
      return docTitle.includes(needle) || folderName.includes(needle) || docId.includes(needle);
    });
  }, [allRequests, documentSearch]);

  const approve = useMutation({
    mutationFn: (requestId: string) => sharingApi.approve(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-sharing-requests"] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: (requestId: string) => sharingApi.reject(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-sharing-requests"] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });

  const ownerLabel = (req: {
    owner_name?: string;
    owner_id?: number;
  }) => req.owner_name ?? (req.owner_id != null ? `User #${req.owner_id}` : "—");

  return (
    <AppShell>
      <section className="py-12 px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Sharing Activity Monitor</h2>
            <p className="text-sm text-muted-foreground">
              Review document shares sent to your account and decide whether to accept or reject them.
            </p>
          </div>

          {!isAdmin && (
          <div className="rounded-2xl border border-border bg-background overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["Requester", "Document/Folder", "Owner", "Permission", "Status", "Requested", ""].map((h) => (
                    <th key={h} className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myIncomingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No pending shares for your account.
                    </td>
                  </tr>
                ) : (
                  myIncomingRequests.map((req) => (
                    <tr key={req.request_id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{req.requester_name}</p>
                        <p className="text-xs text-muted-foreground">{req.requester_email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">{req.document_title || req.folder_name || "—"}</td>
                      <td className="px-6 py-4 text-sm">{ownerLabel(req)}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">
                          {req.permission || "VIEWER"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          req.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          req.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {Number.isNaN(new Date(req.requested_at).getTime())
                          ? "—"
                          : new Date(req.requested_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === "PENDING" ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => approve.mutate(String(req.request_id))}
                              disabled={approve.isPending || reject.isPending}
                              className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => reject.mutate(String(req.request_id))}
                              disabled={approve.isPending || reject.isPending}
                              className="text-destructive hover:text-destructive/80 text-xs font-semibold disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Handled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}

          {isAdmin && (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">User Sharing Log</h3>
                  <p className="text-sm text-muted-foreground">
                    Admin view of all sharing requests. Search by document only.
                  </p>
                </div>
                <div className="w-full max-w-sm">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Search Document
                  </label>
                  <input
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    placeholder="Document title or id"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      {["Requester", "Document", "Owner", "Permission", "Status", "Requested"].map((h) => (
                        <th key={h} className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No sharing log rows match this document search.
                        </td>
                      </tr>
                    ) : (
                      filteredLogRequests.map((req) => (
                        <tr key={`log-${req.request_id}`} className="hover:bg-secondary/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium">{req.requester_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{req.requester_email ?? "—"}</p>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {req.document_title || req.folder_name || `Document #${req.doc_id ?? "—"}`}
                          </td>
                          <td className="px-6 py-4 text-sm">{ownerLabel(req)}</td>
                          <td className="px-6 py-4 text-xs font-semibold">{req.permission || "VIEWER"}</td>
                          <td className="px-6 py-4 text-xs">{req.status}</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {Number.isNaN(new Date(req.requested_at).getTime())
                              ? "—"
                              : new Date(req.requested_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
