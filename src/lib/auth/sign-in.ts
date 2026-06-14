import "server-only";

import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function completeSignIn(userId: string, email: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastSignInAt: new Date(),
      loginCount: { increment: 1 },
    },
  });

  await createSession({ userId, email });
}
