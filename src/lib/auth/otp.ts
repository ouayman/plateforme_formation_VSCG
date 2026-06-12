import { OTP } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export function generateOtpCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function canSendOtp(userId: string): Promise<boolean> {
  const since = new Date(
    Date.now() - OTP.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  );

  const count = await prisma.otpCode.count({
    where: { userId, createdAt: { gte: since } },
  });

  return count < OTP.RATE_LIMIT_COUNT;
}

export async function createOtp(userId: string) {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP.VALIDITY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { userId, code, expiresAt },
  });

  return code;
}

export async function verifyOtp(userId: string, code: string) {
  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false as const, error: "invalid" };

  if (otp.attempts >= OTP.MAX_ATTEMPTS) {
    return { ok: false as const, error: "max_attempts" };
  }

  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, error: "invalid" };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  return { ok: true as const };
}
