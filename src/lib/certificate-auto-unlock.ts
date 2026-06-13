import "server-only";

import { AttendanceStatus, CertificateStatus, SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeAttendancePercent } from "@/lib/attendance-percent";
import { getActiveTrainingParticipantIds } from "@/lib/user-training";

export { computeAttendancePercent } from "@/lib/attendance-percent";

export async function isTrainingFullyCompleted(trainingId: string) {
  const sessions = await prisma.session.findMany({
    where: { trainingId },
    select: { status: true, endDatetime: true },
  });
  const { isTrainingSessionsComplete } = await import("@/lib/session-display");
  return isTrainingSessionsComplete(sessions);
}

async function getAttendancePercentForUser(userId: string, trainingId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      trainingId,
      status: { not: SessionStatus.cancelled },
    },
    select: {
      participants: {
        where: { userId },
        select: { attendanceStatus: true },
      },
    },
  });

  const rows = sessions.map((s) => ({
    attendanceStatus: s.participants[0]?.attendanceStatus ?? null,
  }));

  return computeAttendancePercent(rows);
}

async function unlockCertificateIfEligible(
  trainingId: string,
  userId: string,
  thresholdPercent: number
) {
  const percent = await getAttendancePercentForUser(userId, trainingId);
  if (percent === null || percent < thresholdPercent) return;

  const certificate = await prisma.certificate.findUnique({
    where: { userId_trainingId: { userId, trainingId } },
    select: { id: true, status: true },
  });
  if (!certificate || certificate.status === CertificateStatus.unlocked) return;

  await prisma.certificate.update({
    where: { id: certificate.id },
    data: {
      status: CertificateStatus.unlocked,
      unlockedBy: null,
      unlockedAt: new Date(),
    },
  });

  const { createCertificateAvailablePost } = await import("@/lib/training-system-posts");
  await createCertificateAvailablePost(trainingId, userId);
}

export async function maybeAutoUnlockCertificatesForTraining(trainingId: string) {
  if (!(await isTrainingFullyCompleted(trainingId))) return;

  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: {
      program: {
        select: {
          project: {
            select: {
              company: {
                select: { attendanceThresholdPercent: true },
              },
            },
          },
        },
      },
    },
  });
  if (!training) return;

  const threshold = training.program.project.company.attendanceThresholdPercent;
  const participantIds = await getActiveTrainingParticipantIds(trainingId);

  await Promise.all(
    participantIds.map((userId) => unlockCertificateIfEligible(trainingId, userId, threshold))
  );
}

export async function reevaluateAutoUnlockForCompany(companyId: string) {
  const trainings = await prisma.training.findMany({
    where: { program: { project: { companyId } } },
    select: { id: true },
  });

  for (const { id } of trainings) {
    await maybeAutoUnlockCertificatesForTraining(id);
  }
}
