import "server-only";

import { del, get, put } from "@vercel/blob";
import type { PutFileOptions, ReadFileResult, StorageBackend } from "@/lib/storage/types";
import { contentTypeForKey, toBlobPathname } from "@/lib/storage/keys";

export const blobStorageBackend: StorageBackend = {
  async put(logicalKey, body, options) {
    await put(toBlobPathname(logicalKey), body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: options?.allowOverwrite ?? false,
      contentType: options?.contentType ?? contentTypeForKey(logicalKey),
    });
  },

  async read(logicalKey) {
    try {
      const result = await get(toBlobPathname(logicalKey), { access: "private" });
      if (!result || result.statusCode !== 200 || !result.stream) {
        return null;
      }
      return {
        body: result.stream,
        contentType: result.blob.contentType || contentTypeForKey(logicalKey),
      } satisfies ReadFileResult;
    } catch {
      return null;
    }
  },

  async delete(logicalKey) {
    try {
      await del(toBlobPathname(logicalKey));
    } catch {
      // ignore missing blobs
    }
  },
};
