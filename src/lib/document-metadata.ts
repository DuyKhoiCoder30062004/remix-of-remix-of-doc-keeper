import type { DocumentMeta } from "@/lib/api";

const SIZE_CACHE_KEY = "vault.uploaded.size.cache";

type MetadataObject = Record<string, unknown>;
type SizeCache = Record<string, number>;

export function parseDocumentMetadata(raw: DocumentMeta["metadata"]): MetadataObject {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        return parsed as MetadataObject;
      }
    } catch {
      return {};
    }
    return {};
  }
  return (raw ?? {}) as MetadataObject;
}

function readSizeCache(): SizeCache {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(SIZE_CACHE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as SizeCache;
    }
  } catch {
    return {};
  }
  return {};
}

function writeSizeCache(next: SizeCache) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIZE_CACHE_KEY, JSON.stringify(next));
}

function documentKeyById(doc: Pick<DocumentMeta, "doc_id" | "docId">): string | null {
  const id = doc.doc_id ?? doc.docId;
  if (id == null) return null;
  return `id:${id}`;
}

function documentKeyByTitle(doc: Pick<DocumentMeta, "title">): string {
  return `title:${doc.title}`;
}

function extractMetadataSizeBytes(metadata: MetadataObject): number | undefined {
  const candidates = [
    metadata.size_bytes,
    metadata.sizeBytes,
    metadata.size,
    metadata.contentLength,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return undefined;
}

export function rememberUploadedSize(doc: DocumentMeta, sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return;
  const cache = readSizeCache();

  const idKey = documentKeyById(doc);
  if (idKey) {
    cache[idKey] = sizeBytes;
  }

  cache[documentKeyByTitle(doc)] = sizeBytes;
  writeSizeCache(cache);
}

export function getDocumentSizeBytes(doc: DocumentMeta): number | undefined {
  const metadata = parseDocumentMetadata(doc.metadata);
  const fromMetadata = extractMetadataSizeBytes(metadata);
  if (fromMetadata) return fromMetadata;

  const cache = readSizeCache();
  const idKey = documentKeyById(doc);
  if (idKey && cache[idKey]) return cache[idKey];

  return cache[documentKeyByTitle(doc)];
}
