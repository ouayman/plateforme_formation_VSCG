import { prisma } from "@/lib/prisma";

export async function isUserAssignedToTraining(userId: string, trainingId: string) {
  const row = await prisma.userTraining.findUnique({
    where: { userId_trainingId: { userId, trainingId } },
    select: { deletedAt: true },
  });
  return !!row && row.deletedAt === null;
}

export async function softUnassignUserFromTraining(userId: string, trainingId: string) {
  return prisma.userTraining.update({
    where: { userId_trainingId: { userId, trainingId } },
    data: { deletedAt: new Date() },
  });
}

export async function assignUserToTraining(userId: string, trainingId: string) {
  return prisma.userTraining.upsert({
    where: { userId_trainingId: { userId, trainingId } },
    create: { userId, trainingId },
    update: { deletedAt: null },
  });
}

export async function getActiveTrainingParticipantIds(trainingId: string) {
  const rows = await prisma.userTraining.findMany({
    where: { trainingId, deletedAt: null },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

export async function countActiveTrainingAssignments(trainingId: string, userId: string) {
  return prisma.userTraining.count({
    where: { trainingId, userId, deletedAt: null },
  });
}

export async function getProgramTrainingAssignments(programId: string, userId: string) {
  return prisma.userTraining.findMany({
    where: {
      userId,
      deletedAt: null,
      training: { programId },
    },
    select: {
      trainingId: true,
      training: { select: { id: true, title: true, orderIndex: true } },
    },
    orderBy: { training: { orderIndex: "asc" } },
  });
}
