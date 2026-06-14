import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { PASSWORD } from "@/lib/constants";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generatePasswordResetToken();
  const expiresAt = new Date(
    Date.now() + PASSWORD.RESET_TOKEN_VALIDITY_HOURS * 60 * 60 * 1000
  );

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt,
      },
    }),
  ]);

  return token;
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ ok: true; userId: string } | { ok: false; error: "invalid" | "too_short" }> {
  const tokenHash = hashToken(token);

  const record = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true },
  });

  if (!record) {
    return { ok: false, error: "invalid" };
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(newPassword);
  } catch {
    return { ok: false, error: "too_short" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, userId: record.userId };
}

export async function setUserPassword(userId: string, newPassword: string): Promise<boolean> {
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(newPassword);
  } catch {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return true;
}
