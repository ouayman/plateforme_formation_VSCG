import "server-only";

import path from "path";
import { randomUUID } from "crypto";
import { getExtension } from "@/lib/upload-utils";
import { storage } from "@/lib/storage";
import { contentTypeForKey, isSafeMediaPath, normalizeLogicalKey } from "@/lib/storage/keys";

/** @deprecated Préférer storage — conservé pour compat Docker / scripts. */
export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export { isSafeMediaPath, normalizeLogicalKey };

export async function savePostAttachment(
  trainingId: string,
  attachmentId: string,
  file: File
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${attachmentId}_${safeName}`;
  const logicalKey = path.join("trainings", trainingId, "posts", storedName).replace(/\\/g, "/");
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.put(logicalKey, buffer, {
    contentType: contentTypeForKey(logicalKey, "application/octet-stream"),
  });
  return logicalKey;
}

export async function savePlatformBrandImage(
  kind: "dark" | "light" | "email",
  file: File
): Promise<string> {
  const ext = getExtension(file.name) || ".png";
  const logicalKey = path
    .join("branding", "platform", kind, `${randomUUID()}${ext}`)
    .replace(/\\/g, "/");
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.put(logicalKey, buffer, {
    contentType: contentTypeForKey(logicalKey),
  });
  return logicalKey;
}

export async function saveUserAvatar(userId: string, file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { processAvatarImage } = await import("@/lib/avatar-image");
  const processed = await processAvatarImage(buffer, file.name);
  const logicalKey = path
    .join("avatars", "users", userId, `${randomUUID()}${processed.extension}`)
    .replace(/\\/g, "/");
  await storage.put(logicalKey, processed.buffer, { contentType: processed.contentType });
  return logicalKey;
}

export async function saveCompanyLogo(companyId: string, file: File): Promise<string> {
  const ext = getExtension(file.name) || ".png";
  const logicalKey = path
    .join("branding", "companies", companyId, `${randomUUID()}${ext}`)
    .replace(/\\/g, "/");
  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.put(logicalKey, buffer, {
    contentType: contentTypeForKey(logicalKey),
  });
  return logicalKey;
}

export async function saveSignatorySignatureFromFile(projectId: string, file: File): Promise<string> {
  const ext = getExtension(file.name) || ".png";
  const buffer = Buffer.from(await file.arrayBuffer());
  return saveSignatorySignatureFromBuffer(projectId, buffer, ext);
}

export async function saveSignatorySignatureFromBuffer(
  projectId: string,
  buffer: Buffer,
  ext: string
): Promise<string> {
  const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : ".png";
  const logicalKey = path
    .join("signatures", "projects", projectId, `${randomUUID()}${safeExt}`)
    .replace(/\\/g, "/");
  await storage.put(logicalKey, buffer, { contentType: contentTypeForKey(logicalKey) });
  return logicalKey;
}

export async function deleteStoredFile(logicalKey: string) {
  await storage.delete(logicalKey);
}

/** Supprime un fichier stocké sans faire échouer l'opération (chemins legacy ignorés). */
export async function safeDeleteStoredFile(storedPath: string | null | undefined) {
  if (!storedPath) return;
  if (
    storedPath.startsWith("http://") ||
    storedPath.startsWith("https://") ||
    storedPath.startsWith("/")
  ) {
    return;
  }

  try {
    await deleteStoredFile(storedPath);
  } catch (error) {
    console.error("[storage] delete failed:", storedPath, error);
  }
}

export async function readStoredFile(logicalKey: string) {
  return storage.read(logicalKey);
}
