import "server-only";

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getExtension } from "@/lib/upload-utils";
import { processAvatarImage } from "@/lib/avatar-image";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function savePostAttachment(
  trainingId: string,
  attachmentId: string,
  file: File
): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, "trainings", trainingId, "posts");
  await fs.mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${attachmentId}_${safeName}`;
  const absolutePath = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return path.join("trainings", trainingId, "posts", storedName).replace(/\\/g, "/");
}

export async function savePlatformBrandImage(
  kind: "dark" | "light",
  file: File
): Promise<string> {
  const ext = getExtension(file.name) || ".png";
  const relativePath = path.join("branding", "platform", `${kind}${ext}`);
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);
  return relativePath.replace(/\\/g, "/");
}

export async function saveUserAvatar(userId: string, file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await processAvatarImage(buffer);
  const relativePath = path
    .join("avatars", "users", userId, `${randomUUID()}.webp`)
    .replace(/\\/g, "/");
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, processed);
  return relativePath;
}

export async function saveCompanyLogo(companyId: string, file: File): Promise<string> {
  const ext = getExtension(file.name) || ".png";
  const relativePath = path.join("branding", "companies", companyId, `logo${ext}`);
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);
  return relativePath.replace(/\\/g, "/");
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
  const relativePath = path
    .join("signatures", "projects", projectId, `${randomUUID()}${safeExt}`)
    .replace(/\\/g, "/");
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);
  return relativePath;
}

export async function deleteStoredFile(relativePath: string) {
  try {
    await fs.unlink(path.join(UPLOAD_ROOT, relativePath));
  } catch {
    // ignore missing files
  }
}

export function resolveStoredPath(relativePath: string) {
  const absolute = path.join(UPLOAD_ROOT, relativePath);
  const normalizedRoot = path.normalize(UPLOAD_ROOT);
  const normalizedAbsolute = path.normalize(absolute);
  if (!normalizedAbsolute.startsWith(normalizedRoot)) {
    throw new Error("invalid_path");
  }
  return normalizedAbsolute;
}

export function isSafeMediaPath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (normalized.includes("..") || normalized.includes("\0")) return false;
  return normalized.startsWith("branding/") || normalized.startsWith("signatures/") || normalized.startsWith("avatars/");
}
