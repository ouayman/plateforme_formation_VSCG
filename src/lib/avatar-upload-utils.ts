import { AVATAR_UPLOAD } from "@/lib/constants";
import { getExtension } from "@/lib/upload-utils";

export function validateAvatarUpload(name: string, size: number): string | null {
  const ext = getExtension(name);
  if (!(AVATAR_UPLOAD.ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `Format non autorisé (${AVATAR_UPLOAD.ALLOWED_EXTENSIONS.join(", ")})`;
  }
  if (size > AVATAR_UPLOAD.MAX_SIZE_BYTES) {
    return "Image trop volumineuse (max 5 Mo)";
  }
  return null;
}
