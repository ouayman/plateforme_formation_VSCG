import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { fetchLinkPreview } from "@/lib/link-preview";
import { linkPreviewSchema } from "@/lib/validations/training-post";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = linkPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const preview = await fetchLinkPreview(parsed.data.url);
  if (!preview) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  return NextResponse.json(preview);
}
