import "server-only";

import { blobStorageBackend } from "@/lib/storage/blob-backend";
import { localStorageBackend } from "@/lib/storage/local-backend";
import type { PutFileOptions, ReadFileResult, StorageBackend } from "@/lib/storage/types";

export type { PutFileOptions, ReadFileResult, StorageBackend };
export {
  getStorageEnvPrefix,
  isSafeMediaPath,
  normalizeLogicalKey,
} from "@/lib/storage/keys";

function useBlobStorage(): boolean {
  if (process.env.STORAGE_BACKEND === "local") return false;
  if (process.env.STORAGE_BACKEND === "blob") return true;
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.VERCEL === "1" ||
      process.env.VERCEL === "true"
  );
}

function createStorageBackend(): StorageBackend {
  return useBlobStorage() ? blobStorageBackend : localStorageBackend;
}

let backend: StorageBackend | null = null;

export function getStorage(): StorageBackend {
  if (!backend) {
    backend = createStorageBackend();
  }
  return backend;
}

/** Façade métier — point d'entrée unique pour put/read/delete. */
export const storage = {
  put(logicalKey: string, body: Buffer, options?: PutFileOptions) {
    return getStorage().put(logicalKey, body, options);
  },
  read(logicalKey: string) {
    return getStorage().read(logicalKey);
  },
  delete(logicalKey: string) {
    return getStorage().delete(logicalKey);
  },
  backendName(): "blob" | "local" {
    return useBlobStorage() ? "blob" : "local";
  },
};
