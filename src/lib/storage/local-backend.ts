import "server-only";

import fs from "fs/promises";
import path from "path";
import type { PutFileOptions, ReadFileResult, StorageBackend } from "@/lib/storage/types";
import { contentTypeForKey, normalizeLogicalKey } from "@/lib/storage/keys";

export const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function absolutePath(logicalKey: string): string {
  const normalizedKey = normalizeLogicalKey(logicalKey);
  const absolute = path.join(LOCAL_UPLOAD_ROOT, normalizedKey);
  const root = path.normalize(LOCAL_UPLOAD_ROOT);
  if (!path.normalize(absolute).startsWith(root)) {
    throw new Error("invalid_storage_key");
  }
  return absolute;
}

export const localStorageBackend: StorageBackend = {
  async put(logicalKey, body, options) {
    const target = absolutePath(logicalKey);
    await fs.mkdir(path.dirname(target), { recursive: true });
    if (!options?.allowOverwrite) {
      try {
        await fs.access(target);
        throw new Error("storage_exists");
      } catch (err) {
        if (err instanceof Error && err.message === "storage_exists") throw err;
      }
    }
    await fs.writeFile(target, body);
  },

  async read(logicalKey) {
    try {
      const buffer = await fs.readFile(absolutePath(logicalKey));
      return {
        body: buffer,
        contentType: contentTypeForKey(logicalKey),
      } satisfies ReadFileResult;
    } catch {
      return null;
    }
  },

  async delete(logicalKey) {
    try {
      await fs.unlink(absolutePath(logicalKey));
    } catch {
      // ignore missing files
    }
  },
};
