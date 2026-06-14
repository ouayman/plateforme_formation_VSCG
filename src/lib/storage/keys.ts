import "server-only";

import { imageContentType } from "@/lib/image-upload-utils";

/** Préfixe env dans le Blob store (un seul store, clés séparées par environnement). */
export function getStorageEnvPrefix(): string {
  const explicit = process.env.STORAGE_ENV?.trim();
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV;
  return "development";
}

export function normalizeLogicalKey(logicalKey: string): string {
  const normalized = logicalKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\0")) {
    throw new Error("invalid_storage_key");
  }
  return normalized;
}

export function toBlobPathname(logicalKey: string): string {
  return `${getStorageEnvPrefix()}/${normalizeLogicalKey(logicalKey)}`;
}

export function contentTypeForKey(logicalKey: string, fallback = "application/octet-stream"): string {
  const filename = logicalKey.split("/").pop() ?? logicalKey;
  if (filename.includes(".")) {
    return imageContentType(filename);
  }
  return fallback;
}

/** Chemins autorisés pour /api/media (proxy public sans session). */
export function isSafeMediaPath(logicalKey: string): boolean {
  const normalized = normalizeLogicalKey(logicalKey);
  return (
    normalized.startsWith("branding/") ||
    normalized.startsWith("signatures/") ||
    normalized.startsWith("avatars/")
  );
}
