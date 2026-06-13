import "server-only";

import { SessionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function programCoreSelect() {
  return {
    id: true,
    name: true,
    orderIndex: true,
    project: {
      select: {
        name: true,
        companyId: true,
      },
    },
    trainings: {
      orderBy: { orderIndex: "asc" as const },
      select: {
        id: true,
        title: true,
        description: true,
        orderIndex: true,
        _count: {
          select: {
            sessions: true,
            participants: { where: { deletedAt: null } },
          },
        },
        sessions: {
          where: { status: { not: SessionStatus.cancelled } },
          select: { startDatetime: true, endDatetime: true },
        },
      },
    },
    _count: { select: { participants: true } },
  };
}

export async function loadProgramCore(programId: string, projectId: string) {
  return prisma.program.findUnique({
    where: { id: programId, projectId },
    select: programCoreSelect(),
  });
}

/** Agrégat SQL — évite de charger tous les posts par formation. */
export async function loadTrainingAttachmentCounts(trainingIds: string[]) {
  if (trainingIds.length === 0) return new Map<string, number>();

  const rows = await prisma.$queryRaw<{ training_id: string; count: number }[]>`
    SELECT tp.training_id, COUNT(tpa.id)::int AS count
    FROM training_posts tp
    LEFT JOIN training_post_attachments tpa ON tpa.post_id = tp.id
    WHERE tp.training_id IN (${Prisma.join(trainingIds)})
    GROUP BY tp.training_id
  `;

  return new Map(rows.map((row) => [row.training_id, Number(row.count)]));
}

export async function countProgramFeedbacks(programId: string) {
  return prisma.feedback.count({
    where: { training: { programId } },
  });
}

export async function loadProgramParticipantsData(programId: string) {
  const [participantsRows, userTrainingRows] = await Promise.all([
    prisma.userProgram.findMany({
      where: { programId },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { user: { lastName: "asc" } },
    }),
    prisma.userTraining.findMany({
      where: {
        deletedAt: null,
        training: { programId },
      },
      select: {
        userId: true,
        training: { select: { id: true, title: true, orderIndex: true } },
      },
    }),
  ]);

  const trainingsByUserId = new Map<
    string,
    { id: string; title: string; orderIndex: number }[]
  >();
  for (const row of userTrainingRows) {
    const list = trainingsByUserId.get(row.userId) ?? [];
    list.push(row.training);
    trainingsByUserId.set(row.userId, list);
  }

  return participantsRows.map((p) => ({
    id: p.id,
    userId: p.userId,
    user: {
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      email: p.user.email,
    },
    trainings: (trainingsByUserId.get(p.userId) ?? []).sort(
      (a, b) => a.orderIndex - b.orderIndex
    ),
  }));
}

export async function loadProgramFeedbacksData(programId: string) {
  return prisma.feedback.findMany({
    where: { training: { programId } },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      training: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
