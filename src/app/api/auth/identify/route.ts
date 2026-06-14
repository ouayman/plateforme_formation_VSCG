import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { identifyEmailSchema } from "@/lib/validations/password";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = identifyEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "not_invited" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    hasPassword: Boolean(user.passwordHash),
  });
}
