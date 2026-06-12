import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";

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

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastSignInAt: new Date(),
      loginCount: { increment: 1 },
    },
  });

  await createSession({ userId: user.id, email: user.email });

  return NextResponse.json({ ok: true });
}
