import { IMAGE_UPLOAD } from "@/lib/constants";
import { getExtension } from "@/lib/upload-utils";

export function validateImageUpload(name: string, size: number): string | null {
  const ext = getExtension(name);
  if (!(IMAGE_UPLOAD.ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `Format non autorisé (${IMAGE_UPLOAD.ALLOWED_EXTENSIONS.join(", ")})`;
  }
  if (size > IMAGE_UPLOAD.MAX_SIZE_BYTES) {
    return "Image trop volumineuse (max 5 Mo)";
  }
  return null;
}

export function imageContentType(filename: string): string {
  const ext = getExtension(filename);
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
