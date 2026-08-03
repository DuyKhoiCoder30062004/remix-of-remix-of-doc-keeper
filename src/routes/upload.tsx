import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { UploadCloud } from "lucide-react";
import { documentsApi, apiErrorMessage } from "@/lib/api";
import { getDocumentSizeBytes } from "@/lib/document-metadata";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

type Row = { name: string; size: string; progress: number };

function UploadPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: recent = [] } = useQuery({
    queryKey: ["documents", { q: "" }],
    queryFn: () => documentsApi.list(),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const idx = rows.length;
      setRows((r) => [...r, { name: file.name, size: formatSize(file.size), progress: 0 }]);
      return documentsApi.upload({
        file,
        title: file.name,
        onProgress: (pct) =>
          setRows((r) => r.map((row, i) => (i === idx ? { ...row, progress: pct } : row))),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    onError: (err) => alert(apiErrorMessage(err)),
  });

  function pickFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => upload.mutate(f));
  }

  return (
    <AppShell showHeader={false}>
      <section className="py-12 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Upload Documents</h2>
            <p className="text-sm text-muted-foreground">
              Ingest new files into the vault. All uploads are logged and permissioned to you by default.
            </p>
          </div>

          <div
            className="bg-background ring-1 ring-border rounded-3xl p-12 text-center border-2 border-dashed border-border cursor-pointer"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => pickFiles(e.target.files)}
            />
            <div className="size-12 bg-secondary rounded-2xl mx-auto mb-4 grid place-items-center">
              <UploadCloud className="size-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-medium mb-2">Drop files here to ingest</h3>
            <p className="text-sm text-muted-foreground max-w-[40ch] mx-auto text-pretty">
              Support for PDF, Excel, Word, and system images up to 50MB per file.
            </p>
            <button className="mt-6 bg-foreground text-background text-sm font-medium py-2 px-6 rounded-xl hover:brightness-110 transition">
              Select from local drive
            </button>
          </div>

          <div className="mt-10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              This session
            </h3>
            <div className="space-y-2">
              {rows.length === 0 && (
                <p className="text-xs text-muted-foreground">No files uploaded yet.</p>
              )}
              {rows.map((r, i) => (
                <UploadRow key={i} {...r} />
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Recent in vault
            </h3>
            <div className="space-y-2">
              {recent.slice(0, 5).map((d) => (
                <UploadRow key={d.doc_id ?? d.docId} name={d.title} size={formatSize(getDocumentSizeBytes(d))} progress={100} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

function UploadRow({ name, size, progress }: Row) {
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
