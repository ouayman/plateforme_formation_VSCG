import { NextResponse } from "next/server";

import { canSendOtp } from "@/lib/auth/otp";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/mail/send-password-reset";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/password";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true },
  });

  // Réponse identique que l'utilisateur existe ou non (évite l'énumération)
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const allowed = await canSendOtp(user.id);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  try {
    const token = await createPasswordResetToken(user.id);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail(user.email, resetUrl, user.firstName);
  } catch (error) {
    console.error("[forgot-password] email failed:", error);
    return NextResponse.json({ error: "email_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
