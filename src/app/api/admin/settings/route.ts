import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/platform-settings";
import { platformSettingsSchema } from "@/lib/validations/settings";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const settings = await getPlatformSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = platformSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  await updatePlatformSettings(parsed.data);
  return NextResponse.json(parsed.data);
}
