import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require";
import { validateImageUpload } from "@/lib/image-upload-utils";
import { updatePlatformBrandImage } from "@/lib/platform-settings";
import { savePlatformBrandImage } from "@/lib/uploads";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  if (kind !== "dark" && kind !== "light") {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const validationError = validateImageUpload(file.name, file.size);
  if (validationError) {
    return NextResponse.json({ error: "invalid_file", message: validationError }, { status: 400 });
  }

  try {
    const storedPath = await savePlatformBrandImage(kind, file);
    const settings = await updatePlatformBrandImage(kind, storedPath);
    return NextResponse.json({ path: storedPath, settings });
  } catch {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
