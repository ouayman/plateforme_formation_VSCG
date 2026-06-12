import { prisma } from "@/lib/prisma";

export async function syncSessionTrainers(sessionId: string, trainerIds: string[]) {
  const uniqueIds = Array.from(new Set(trainerIds.filter(Boolean)));

  await prisma.sessionTrainer.deleteMany({ where: { sessionId } });

  if (uniqueIds.length > 0) {
    await prisma.sessionTrainer.createMany({
      data: uniqueIds.map((userId) => ({ sessionId, userId })),
    });
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { trainerId: uniqueIds[0] ?? null },
  });
}

export const sessionInclude = {
  trainer: { select: { id: true, firstName: true, lastName: true } },
  trainers: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  location: { select: { id: true, name: true } },
  _count: { select: { participants: true } },
} as const;
