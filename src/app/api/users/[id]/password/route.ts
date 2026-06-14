import { NextResponse } from "next/server";

import { setUserPassword } from "@/lib/auth/password-reset";
import { requireAdminApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { adminSetPasswordSchema } from "@/lib/validations/password";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = adminSetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    const tooShort = parsed.error.issues.some((i) => i.message === "too_short");
    return NextResponse.json(
      { error: tooShort ? "too_short" : "invalid_input" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ok = await setUserPassword(params.id, parsed.data.newPassword);
  if (!ok) {
    return NextResponse.json({ error: "too_short" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
