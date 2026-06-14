import { NextResponse } from "next/server";

import { resetPasswordWithToken } from "@/lib/auth/password-reset";
import { resetPasswordSchema } from "@/lib/validations/password";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    const tooShort = parsed.error.issues.some((i) => i.message === "too_short");
    return NextResponse.json(
      { error: tooShort ? "too_short" : "invalid_input" },
      { status: 400 }
    );
  }

  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);

  if (!result.ok) {
    const status = result.error === "too_short" ? 400 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
