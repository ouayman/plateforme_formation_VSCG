import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { setUserPassword } from "@/lib/auth/password-reset";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { changeAccountPasswordSchema } from "@/lib/validations/password";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = changeAccountPasswordSchema.safeParse(body);

  if (!parsed.success) {
    const tooShort = parsed.error.issues.some((i) => i.message === "too_short");
    return NextResponse.json(
      { error: tooShort ? "too_short" : "invalid_input" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (dbUser.passwordHash) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json({ error: "current_required" }, { status: 400 });
    }

    const valid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "invalid_current" }, { status: 401 });
    }
  }

  const ok = await setUserPassword(user.id, parsed.data.newPassword);
  if (!ok) {
    return NextResponse.json({ error: "too_short" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
