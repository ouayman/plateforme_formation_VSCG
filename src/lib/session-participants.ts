import { SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveTrainingParticipantIds } from "@/lib/user-training";

const ACTIVE_SESSION_STATUSES: SessionStatus[] = [
  SessionStatus.confirmed,
  SessionStatus.pending,
];

export async function syncSessionParticipants(sessionId: string, trainingId: string) {
  const participantIds = await getActiveTrainingParticipantIds(trainingId);
  if (participantIds.length === 0) return;

  await prisma.sessionParticipant.createMany({
    data: participantIds.map((userId) => ({ sessionId, userId })),
    skipDuplicates: true,
  });
}

export async function syncTrainingParticipantToSessions(trainingId: string, userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      trainingId,
      status: { in: ACTIVE_SESSION_STATUSES },
    },
    select: { id: true },
  });

  if (sessions.length === 0) return;

  await prisma.sessionParticipant.createMany({
    data: sessions.map((s) => ({ sessionId: s.id, userId })),
    skipDuplicates: true,
  });
}

export async function removeTrainingParticipantFromSessions(trainingId: string, userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      trainingId,
      status: { in: ACTIVE_SESSION_STATUSES },
    },
    select: { id: true },
  });

  if (sessions.length === 0) return;

  await prisma.sessionParticipant.deleteMany({
    where: {
      userId,
      sessionId: { in: sessions.map((s) => s.id) },
    },
  });
}

export async function removeProgramParticipantFromSessions(programId: string, userId: string) {
  const trainings = await prisma.training.findMany({
    where: { programId },
    select: { id: true },
  });

  for (const training of trainings) {
    await removeTrainingParticipantFromSessions(training.id, userId);
  }
}

/** Sync sessions actives de toutes les formations affectées du programme */
export async function syncProgramParticipantToSessions(programId: string, userId: string) {
  const assignments = await prisma.userTraining.findMany({
    where: { userId, deletedAt: null, training: { programId } },
    select: { trainingId: true },
  });

  for (const row of assignments) {
    await syncTrainingParticipantToSessions(row.trainingId, userId);
  }
}
