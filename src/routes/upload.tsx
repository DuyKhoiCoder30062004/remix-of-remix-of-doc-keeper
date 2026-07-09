import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { UploadCloud } from "lucide-react";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

function UploadPage() {
  return (
    <AppShell>
      <section className="py-12 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Upload Documents</h2>
            <p className="text-sm text-muted-foreground">
              Ingest new files into the vault. All uploads are logged and permissioned to you by default.
            </p>
          </div>

          <div className="bg-background ring-1 ring-border rounded-3xl p-12 text-center border-2 border-dashed border-border">
            <div className="size-12 bg-secondary rounded-2xl mx-auto mb-4 grid place-items-center">
              <UploadCloud className="size-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-medium mb-2">Drop archives here to ingest</h3>
            <p className="text-sm text-muted-foreground max-w-[40ch] mx-auto text-pretty">
              Support for PDF, Excel, Word, and system images up to 50MB per file.
            </p>
            <button className="mt-6 bg-foreground text-background text-sm font-medium py-2 px-6 rounded-xl hover:brightness-110 transition">
              Select from local drive
            </button>
          </div>

          <div className="mt-10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Recent uploads
            </h3>
            <div className="space-y-2">
              <UploadRow name="Q1_Board_Deck.pdf" size="3.4 MB" progress={100} />
              <UploadRow name="Vendor_List_2024.xlsx" size="620 KB" progress={72} />
              <UploadRow name="NDA_Template.docx" size="88 KB" progress={100} />
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function UploadRow({ name, size, progress }: { name: string; size: string; progress: number }) {
  const done = progress === 100;
  return (
    <div className="flex items-center justify-between p-4 bg-background ring-1 ring-border rounded-xl">
      <div className="flex items-center gap-3">
        <div className="size-8 bg-secondary rounded-md" />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-[10px] text-muted-foreground">
            {size} • {done ? "Complete" : `${progress}% uploaded`}
          </p>
        </div>
      </div>
      <div className="w-40 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${done ? "bg-primary" : "bg-foreground/60"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}