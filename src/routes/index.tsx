import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type Row = {
  id: string;
  name: string;
  ext: "PDF" | "XLS" | "DOC" | "IMG";
  extBg: string;
  type: string;
  size: string;
  owner: string;
  status: "Shared" | "Private";
};

const rows: Row[] = [
  { id: "1", name: "Q4_Audit_Report.pdf", ext: "PDF", extBg: "bg-blue-100 text-blue-700", type: "Report", size: "4.2 MB", owner: "Sarah J.", status: "Shared" },
  { id: "2", name: "Payroll_Master_Sheet_2024.xlsx", ext: "XLS", extBg: "bg-emerald-100 text-emerald-700", type: "Excel", size: "1.8 MB", owner: "Admin Thorne", status: "Private" },
  { id: "3", name: "Service_Agreement_v4.pdf", ext: "PDF", extBg: "bg-blue-100 text-blue-700", type: "Contract", size: "892 KB", owner: "Sarah J.", status: "Shared" },
  { id: "4", name: "Employee_Handbook.docx", ext: "DOC", extBg: "bg-indigo-100 text-indigo-700", type: "Word", size: "640 KB", owner: "Elena R.", status: "Shared" },
  { id: "5", name: "Board_Meeting_Photo.png", ext: "IMG", extBg: "bg-amber-100 text-amber-700", type: "Image", size: "2.1 MB", owner: "Marcus T.", status: "Private" },
];

function Dashboard() {
  return (
    <AppShell primaryAction={{ label: "New Document", to: "/upload" }}>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Recent Documents</h2>
          <p className="text-sm text-muted-foreground">Displaying active files across all shared environments.</p>
        </div>

        <div className="bg-background ring-1 ring-border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["Document Name", "Type", "Size", "Owner", "Status", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/60 transition-colors">
                  <td className="px-6 py-4">
                    <Link to="/documents/$id" params={{ id: r.id }} className="flex items-center gap-3">
                      <div className={`size-8 rounded-lg grid place-items-center text-[10px] font-bold ${r.extBg}`}>
                        {r.ext}
                      </div>
                      <span className="text-sm font-medium">{r.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.type}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.size}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="size-5 bg-input rounded-full" />
                      <span className="text-xs text-foreground/80">{r.owner}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                        r.status === "Shared"
                          ? "bg-secondary text-foreground/80"
                          : "bg-foreground text-background"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="size-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
