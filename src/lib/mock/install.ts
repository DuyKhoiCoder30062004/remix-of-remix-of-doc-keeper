// Installs an axios-mock-adapter over the shared api client so every screen
// resolves against in-memory data. Toggle with VITE_USE_MOCK=false to hit a
// real backend later — the endpoints below mirror INTEGRATION_PLAN.md 1:1.
import MockAdapter from "axios-mock-adapter";
import { api } from "@/lib/api/client";
import {
  auditLog,
  documents,
  folders,
  permissions,
  publicUser,
  sharingRequests,
  uid,
  users,
} from "./db";

let installed = false;

export function installMockApi() {
  if (installed) return;
  installed = true;

  const mock = new MockAdapter(api, { delayResponse: 220 });

  // ---------- auth ----------
  mock.onPost("/auth/register").reply((config) => {
    const { name, email, password } = JSON.parse(config.data);
    if (users.some((u) => u.email === email)) {
      return [409, { message: "Email already registered" }];
    }
    const user = {
      user_id: uid("u"),
      name,
      email,
      role: "USER" as const,
      password,
      created_at: new Date().toISOString(),
    };
    users.push(user);
    return [200, { token: `mock.${user.user_id}`, user: publicUser(user) }];
  });

  mock.onPost("/auth/login").reply((config) => {
    const { email, password } = JSON.parse(config.data);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return [401, { message: "Invalid credentials" }];
    return [200, { token: `mock.${user.user_id}`, user: publicUser(user) }];
  });

  mock.onPost("/auth/logout").reply(204);
  mock.onPost("/auth/password/forgot").reply(204);
  mock.onPost("/auth/password/reset").reply(204);

  mock.onGet("/auth/me").reply((config) => {
    const id = tokenUserId(config.headers?.Authorization);
    const user = users.find((u) => u.user_id === id);
    if (!user) return [401, { message: "Not authenticated" }];
    return [200, publicUser(user)];
  });

  // ---------- users (admin) ----------
  mock.onGet("/users").reply((config) => {
    const q = (config.params?.q as string | undefined)?.toLowerCase();
    const list = users
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map(publicUser);
    return [200, list];
  });

  mock.onPatch(/\/users\/[^/]+\/role$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const { role } = JSON.parse(config.data);
    const user = users.find((u) => u.user_id === id);
    if (!user) return [404, { message: "User not found" }];
    user.role = role;
    return [200, publicUser(user)];
  });

  mock.onDelete(/\/users\/[^/]+$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const idx = users.findIndex((u) => u.user_id === id);
    if (idx < 0) return [404, { message: "User not found" }];
    users.splice(idx, 1);
    return [204];
  });

  mock.onGet("/users/audit/export").reply(() => {
    const csv =
      "log_id,doc_id,actor_id,actor_name,action,occurred_at\n" +
      auditLog.map((l) => [l.log_id, l.doc_id, l.actor_id, l.actor_name, l.action, l.occurred_at].join(",")).join("\n");
    return [200, new Blob([csv], { type: "text/csv" })];
  });

  // ---------- folders ----------
  mock.onGet("/folders").reply((config) => {
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const visible = actor.role === "ADMIN" ? folders : folders.filter((f) => f.owner_id === actor.user_id);
    return [200, visible];
  });
  mock.onPost("/folders").reply((config) => {
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const { name } = JSON.parse(config.data);
    const f = { folder_id: uid("f"), name, owner_id: actor.user_id, created_at: new Date().toISOString() };
    folders.push(f);
    return [200, f];
  });
  mock.onPatch(/\/folders\/[^/]+$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const { name } = JSON.parse(config.data);
    const f = folders.find((x) => x.folder_id === id);
    if (!f) return [404, { message: "Folder not found" }];
    if (actor.role === "ADMIN") return [403, { message: "Admins can only delete folders." }];
    if (f.owner_id !== actor.user_id) return [403, { message: "You can only rename your own folders." }];
    f.name = name;
    return [200, f];
  });
  mock.onDelete(/\/folders\/[^/]+$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const f = folders.find((x) => x.folder_id === id);
    if (!f) return [404, { message: "Folder not found" }];
    if (actor.role !== "ADMIN" && f.owner_id !== actor.user_id) {
      return [403, { message: "You can only delete your own folders." }];
    }
    const idx = folders.findIndex((x) => x.folder_id === id);
    folders.splice(idx, 1);
    return [204];
  });

  // ---------- documents ----------
  mock.onGet("/documents").reply((config) => {
    const { folder_id, q } = config.params ?? {};
    const needle = (q as string | undefined)?.toLowerCase();
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const list = documents.filter((d) => {
      if (actor.role !== "ADMIN" && d.owner_id !== actor.user_id) return false;
      if (folder_id !== undefined && folder_id !== null && d.folder_id !== folder_id) return false;
      if (needle && !d.title.toLowerCase().includes(needle)) return false;
      return true;
    });
    return [200, list];
  });

  mock.onGet("/documents/search").reply((config) => {
    const needle = ((config.params?.q as string) ?? "").toLowerCase();
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const visible = documents.filter((d) => actor.role === "ADMIN" || d.owner_id === actor.user_id);
    return [200, visible.filter((d) => d.title.toLowerCase().includes(needle))];
  });

  mock.onGet(/\/documents\/[^/]+$/).reply((config) => {
    const id = config.url!.split("/")[2];
    if (id === "search") return [400];
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const d = documents.find((x) => x.doc_id === id);
    if (!d) return [404, { message: "Document not found" }];
    if (actor.role !== "ADMIN" && d.owner_id !== actor.user_id) {
      return [404, { message: "Document not found" }];
    }
    return [200, d];
  });

  mock.onPost("/documents").reply((config) => {
    // multipart form data; we can't easily parse it here, so synthesize.
    const now = new Date().toISOString();
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const title = extractField(config.data, "title") ?? `Untitled_${documents.length + 1}.pdf`;
    const folder_id = extractField(config.data, "folder_id") ?? null;
    const doc = {
      doc_id: uid("d"),
      title,
      owner_id: actor.user_id,
      owner_name: actor.name,
      folder_id,
      metadata: { mime_type: "application/octet-stream", size_bytes: 0, extension: title.split(".").pop()?.toUpperCase() ?? "BIN" },
      created_at: now,
      updated_at: now,
    };
    documents.unshift(doc);
    permissions.push({
      perm_id: uid("p"),
      doc_id: doc.doc_id,
      user_id: actor.user_id,
      user_name: actor.name,
      user_email: actor.email,
      access_type: "OWNER",
    });
    auditLog.unshift({
      log_id: uid("a"),
      doc_id: doc.doc_id,
      actor_id: actor.user_id,
      actor_name: actor.name,
      action: "UPLOADED",
      occurred_at: now,
    });
    return [200, doc];
  });

  mock.onPut(/\/documents\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/')[2];
    const body = JSON.parse(config.data);
    const d = documents.find((x) => x.doc_id === id);
    if (!d) return [404, { message: 'Document not found' }];
    if (body.title) d.title = body.title;
    if (body.folder_id !== undefined) d.folder_id = body.folder_id;
    if (body.metadata) d.metadata = { ...d.metadata, ...body.metadata };
    d.updated_at = new Date().toISOString();
    return [200, d];
  });

  mock.onPatch(/\/documents\/[^/]+\/move$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const { folder_id } = JSON.parse(config.data);
    const d = documents.find((x) => x.doc_id === id);
    if (!d) return [404, { message: "Document not found" }];
    if (actor.role === "ADMIN") return [403, { message: "Admins can only delete documents." }];
    if (d.owner_id !== actor.user_id) return [403, { message: "You can only move your own documents." }];
    d.folder_id = folder_id;
    d.updated_at = new Date().toISOString();
    return [200, d];
  });

  mock.onPatch(/\/documents\/[^/]+$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const { title } = JSON.parse(config.data);
    const d = documents.find((x) => x.doc_id === id);
    if (!d) return [404, { message: "Document not found" }];
    if (actor.role === "ADMIN") return [403, { message: "Admins can only delete documents." }];
    if (d.owner_id !== actor.user_id) return [403, { message: "You can only rename your own documents." }];
    d.title = title;
    d.updated_at = new Date().toISOString();
    return [200, d];
  });

  mock.onDelete(/\/documents\/[^/]+$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const d = documents.find((x) => x.doc_id === id);
    if (!d) return [404, { message: "Document not found" }];
    if (actor.role !== "ADMIN" && d.owner_id !== actor.user_id) {
      return [403, { message: "You can only delete your own documents." }];
    }
    const idx = documents.findIndex((x) => x.doc_id === id);
    documents.splice(idx, 1);
    return [204];
  });

  mock.onGet(/\/documents\/[^/]+\/download$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const d = documents.find((x) => x.doc_id === id);
    if (!d) return [404];
    return [200, new Blob([`Mock content for ${d.title}`], { type: d.metadata.mime_type ?? "text/plain" })];
  });

  mock.onGet(/\/documents\/[^/]+\/audit$/).reply((config) => {
    const id = config.url!.split("/")[2];
    return [200, auditLog.filter((l) => l.doc_id === id)];
  });

  // ---------- permissions ----------
  mock.onGet("/permissions").reply((config) => {
    const docId = config.params?.doc_id as string | undefined;
    return [200, permissions.filter((p) => !docId || p.doc_id === docId)];
  });

  mock.onPost("/permissions").reply((config) => {
    const { doc_id, user_id, access_type } = JSON.parse(config.data);
    const user = users.find((u) => u.user_id === user_id);
    const perm = {
      perm_id: uid("p"),
      doc_id,
      user_id,
      user_name: user?.name,
      user_email: user?.email,
      access_type,
    };
    permissions.push(perm);
    return [200, perm];
  });

  mock.onPut(/\/permissions\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/')[2];
    const { access_type } = JSON.parse(config.data);
    const p = permissions.find((x) => x.perm_id === id);
    if (!p) return [404, { message: 'Permission not found' }];
    p.access_type = access_type;
    return [200, p];
  });

  mock.onPatch(/\/permissions\/[^/]+$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const { access_type } = JSON.parse(config.data);
    const p = permissions.find((x) => x.perm_id === id);
    if (!p) return [404, { message: "Permission not found" }];
    p.access_type = access_type;
    return [200, p];
  });

  mock.onDelete(/\/permissions\/[^/]+$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const idx = permissions.findIndex((x) => x.perm_id === id);
    if (idx < 0) return [404, { message: "Permission not found" }];
    permissions.splice(idx, 1);
    return [204];
  });

  // ---------- sharing requests ----------
  mock.onGet("/sharing-requests").reply((config) => {
    const { status, doc_id } = config.params ?? {};
    return [
      200,
      sharingRequests.filter(
        (r) => (!status || r.status === status) && (!doc_id || r.doc_id === doc_id),
      ),
    ];
  });

  mock.onPost("/sharing-requests").reply((config) => {
    const { doc_id } = JSON.parse(config.data);
    const actor = users.find((u) => u.user_id === currentUserId(config)) ?? users[0];
    const req = {
      request_id: uid("sr"),
      doc_id,
      requester_id: actor.user_id,
      requester_name: actor.name,
      status: "PENDING" as const,
      requested_at: new Date().toISOString(),
    };
    sharingRequests.push(req);
    return [200, req];
  });

  mock.onPut(/\/sharing-requests\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/')[2];
    const { status } = JSON.parse(config.data);
    const r = sharingRequests.find((x) => x.request_id === id);
    if (!r) return [404, { message: 'Sharing request not found' }];
    r.status = status;
    return [200, r];
  });

  mock.onPost(/\/sharing-requests\/[^/]+\/approve$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const r = sharingRequests.find((x) => x.request_id === id);
    if (!r) return [404, { message: "Request not found" }];
    r.status = "APPROVED";
    permissions.push({
      perm_id: uid("p"),
      doc_id: r.doc_id,
      user_id: r.requester_id,
      user_name: r.requester_name,
      user_email: users.find((u) => u.user_id === r.requester_id)?.email,
      access_type: "VIEWER",
    });
    return [200, r];
  });

  mock.onPost(/\/sharing-requests\/[^/]+\/reject$/).reply((config) => {
    const id = config.url!.split("/")[2];
    const r = sharingRequests.find((x) => x.request_id === id);
    if (!r) return [404, { message: "Request not found" }];
    r.status = "REJECTED";
    return [200, r];
  });

  // Fall-through for anything else — surface loudly in dev.
  mock.onAny().reply((config) => {
    console.warn("[mock] unhandled request", config.method, config.url);
    return [501, { message: `Mock not implemented: ${config.method} ${config.url}` }];
  });
}

function tokenUserId(auth: unknown): string | null {
  if (typeof auth !== "string") return null;
  const m = auth.match(/^Bearer mock\.(.+)$/);
  return m ? m[1] : null;
}

function currentUserId(config: { headers?: Record<string, unknown> }): string {
  return tokenUserId(config.headers?.Authorization) ?? "u_admin";
}

function extractField(data: unknown, field: string): string | null {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const v = data.get(field);
    return typeof v === "string" ? v : null;
  }
  return null;
}
