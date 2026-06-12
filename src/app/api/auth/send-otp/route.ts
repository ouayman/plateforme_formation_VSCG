import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canSendOtp, createOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/mail/send-otp";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "not_invited" }, { status: 404 });
  }

  const allowed = await canSendOtp(user.id);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  const code = await createOtp(user.id);
  await sendOtpEmail(email, code);

  return NextResponse.json({ ok: true });
}
