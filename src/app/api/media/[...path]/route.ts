import { NextResponse } from "next/server";
import { imageContentType } from "@/lib/image-upload-utils";
import { isSafeMediaPath, readStoredFile } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const relativePath = params.path.join("/");

  if (!isSafeMediaPath(relativePath)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const file = await readStoredFile(relativePath);
  if (!file) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const filename = relativePath.split("/").pop() ?? "file";
  const contentType =
    file.contentType !== "application/octet-stream"
      ? file.contentType
      : imageContentType(filename);

  const cacheControl = relativePath.startsWith("branding/")
    ? "public, max-age=3600, stale-while-revalidate=86400"
    : "public, max-age=86400, immutable";

  return new NextResponse(file.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });
}
