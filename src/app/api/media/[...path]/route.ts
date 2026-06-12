import { NextResponse } from "next/server";
import { imageContentType } from "@/lib/image-upload-utils";
import { isSafeMediaPath, resolveStoredPath } from "@/lib/uploads";
import fs from "fs/promises";

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const relativePath = params.path.join("/");

  if (!isSafeMediaPath(relativePath)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const absolutePath = resolveStoredPath(relativePath);
    const buffer = await fs.readFile(absolutePath);
    const filename = relativePath.split("/").pop() ?? "file";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": imageContentType(filename),
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
