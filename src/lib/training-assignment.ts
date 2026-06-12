import { prisma } from "@/lib/prisma";
import { ensureCertificate } from "@/lib/certificates";
import { createWelcomePost } from "@/lib/training-system-posts";
import {
  removeTrainingParticipantFromSessions,
  syncTrainingParticipantToSessions,
} from "@/lib/session-participants";
import { assignUserToTraining, softUnassignUserFromTraining } from "@/lib/user-training";
import { ensureUserCompanyAffiliation } from "@/lib/user-company";

export async function assignParticipantToTraining(
  userId: string,
  trainingId: string,
  companyId: string
) {
  await ensureUserCompanyAffiliation(userId, companyId);
  await assignUserToTraining(userId, trainingId);
  await ensureCertificate(userId, trainingId);
  await syncTrainingParticipantToSessions(trainingId, userId);
  await createWelcomePost(trainingId, userId);
}

export async function unassignParticipantFromTraining(userId: string, trainingId: string) {
  await softUnassignUserFromTraining(userId, trainingId);
  await removeTrainingParticipantFromSessions(trainingId, userId);
}

export async function assignParticipantToTrainings(
  userId: string,
  trainingIds: string[],
  companyId: string
) {
  for (const trainingId of trainingIds) {
    await assignParticipantToTraining(userId, trainingId, companyId);
  }
}

export async function ensureProgramEnrollment(userId: string, programId: string) {
  return prisma.userProgram.upsert({
    where: { userId_programId: { userId, programId } },
    create: { userId, programId },
    update: {},
  });
}
