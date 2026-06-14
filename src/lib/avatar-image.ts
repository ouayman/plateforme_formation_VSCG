import "server-only";

import { AVATAR_UPLOAD } from "@/lib/constants";
import { imageContentType } from "@/lib/image-upload-utils";
import { getExtension } from "@/lib/upload-utils";

export type ProcessedAvatar = {
  buffer: Buffer;
  extension: string;
  contentType: string;
};

export async function processAvatarImage(
  input: Buffer,
  sourceFilename: string
): Promise<ProcessedAvatar> {
  const sourceExt = getExtension(sourceFilename) || ".jpg";

  try {
    const { default: sharp } = await import("sharp");
    const buffer = await sharp(input)
      .rotate()
      .resize(AVATAR_UPLOAD.OUTPUT_SIZE, AVATAR_UPLOAD.OUTPUT_SIZE, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: AVATAR_UPLOAD.OUTPUT_QUALITY })
      .toBuffer();

    return { buffer, extension: ".webp", contentType: "image/webp" };
  } catch (error) {
    console.error("[avatar] sharp processing failed, using original file:", error);
    return {
      buffer: input,
      extension: sourceExt,
      contentType: imageContentType(`avatar${sourceExt}`),
    };
  }
}
