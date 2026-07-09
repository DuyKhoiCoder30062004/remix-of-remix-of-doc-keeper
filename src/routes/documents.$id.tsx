import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Download, Pencil, Trash2, FolderInput } from "lucide-react";

export const Route = createFileRoute("/documents/$id")({
  component: DocumentDetail,
});

function DocumentDetail() {
  return (
    <AppShell>
      <section className="py-12 px-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="size-12 bg-blue-100 text-blue-700 rounded-xl grid place-items-center font-bold">
                PDF
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold tracking-tight">Service_Agreement_v4.pdf</h2>
                <p className="text-sm text-muted-foreground">Uploaded Oct 14, 2023 • 892 KB • Contract</p>
              </div>
              <div className="flex gap-2">
                <IconBtn icon={Download} label="Download" />
                <IconBtn icon={Pencil} label="Rename" />
                <IconBtn icon={FolderInput} label="Move" />
                <IconBtn icon={Trash2} label="Delete" destructive />
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
                <PermRow name="Sarah Jenkins" email="sarah@firm.com" role="Owner" locked />
                <PermRow name="David Chen" email="d.chen@firm.com" role="Editor" />
                <PermRow name="Priya Nair" email="p.nair@firm.com" role="Viewer" />
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Access Requests
                </h4>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg ring-1 ring-border">
                  <div className="flex items-center gap-2">
                    <div className="size-6 bg-amber-100 text-amber-700 rounded-full text-[8px] grid place-items-center font-bold">
                      ER
                    </div>
                    <span className="text-xs font-medium">Elena R.</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-semibold text-primary-strong px-2 py-1 hover:underline">Approve</button>
                    <button className="text-[10px] font-semibold text-destructive px-2 py-1 hover:underline">Deny</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-foreground text-background rounded-2xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-background/60 mb-3">
                Audit Log
              </h3>
              <ul className="text-[11px] space-y-3">
                <LogRow who="Modified by Marcus" when="12:04 PM" />
                <LogRow who="Downloaded by Elena" when="Oct 12" />
                <LogRow who="Permission changed" when="Oct 10" />
                <LogRow who="Uploaded by Sarah" when="Oct 08" />
              </ul>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function IconBtn({ icon: Icon, label, destructive }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; destructive?: boolean }) {
  return (
    <button
      title={label}
      className={`size-9 grid place-items-center rounded-lg ring-1 ring-border bg-background hover:bg-secondary transition ${
        destructive ? "text-destructive" : "text-foreground/70"
      }`}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </button>
  );
}

function PermRow({ name, email, role, locked }: { name: string; email: string; role: string; locked?: boolean }) {
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
          defaultValue={role}
          className="text-[10px] font-semibold bg-background ring-1 ring-border px-2 py-0.5 rounded uppercase"
        >
          <option>Editor</option>
          <option>Viewer</option>
        </select>
      )}
    </div>
  );
}

function LogRow({ who, when }: { who: string; when: string }) {
  return (
    <li className="flex justify-between">
      <span className="text-background/60">{who}</span>
      <span>{when}</span>
    </li>
  );
}