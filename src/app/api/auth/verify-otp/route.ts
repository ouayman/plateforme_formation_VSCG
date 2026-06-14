import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveLandingPath } from "@/lib/auth/landing";
import { completeSignIn } from "@/lib/auth/sign-in";
import { verifyOtp } from "@/lib/auth/otp";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(4),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "not_invited" }, { status: 404 });
  }

  const result = await verifyOtp(user.id, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  await completeSignIn(user.id, user.email);

  const redirectTo = await resolveLandingPath(user.id);

  return NextResponse.json({ ok: true, redirectTo });
}
