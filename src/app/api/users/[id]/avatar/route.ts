import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require";
import { removeUserAvatar, uploadUserAvatar } from "@/lib/user-avatar";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const result = await uploadUserAvatar(params.id, file);
  if ("error" in result) {
    if (result.error === "invalid_file") {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }
    if (result.error === "not_found") {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ path: result.path, avatarUrl: result.user.avatarUrl });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const result = await removeUserAvatar(params.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
