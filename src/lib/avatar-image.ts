import "server-only";

import sharp from "sharp";
import { AVATAR_UPLOAD } from "@/lib/constants";

export async function processAvatarImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(AVATAR_UPLOAD.OUTPUT_SIZE, AVATAR_UPLOAD.OUTPUT_SIZE, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: AVATAR_UPLOAD.OUTPUT_QUALITY })
    .toBuffer();
}
