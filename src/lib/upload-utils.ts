import { UPLOAD } from "@/lib/constants";

export function getExtension(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

export function validateUploadFile(name: string, size: number): string | null {
  const ext = getExtension(name);
  if (!(UPLOAD.ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `Type de fichier non autorisé (${UPLOAD.ALLOWED_EXTENSIONS.join(", ")})`;
  }
  if (size > UPLOAD.MAX_SIZE_BYTES) {
    return "Fichier trop volumineux (max 25 Mo)";
  }
  return null;
}

export function displayFileName(relativePath: string) {
  const base = relativePath.split(/[/\\]/).pop() ?? relativePath;
  const idx = base.indexOf("_");
  return idx >= 0 ? base.slice(idx + 1) : base;
}
