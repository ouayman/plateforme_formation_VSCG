import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { completeSignIn } from "@/lib/auth/sign-in";
import { prisma } from "@/lib/prisma";
import { loginPasswordSchema } from "@/lib/validations/password";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = loginPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  if (!user.passwordHash) {
    return NextResponse.json({ error: "no_password" }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await completeSignIn(user.id, user.email);

  return NextResponse.json({ ok: true });
}
