import { prisma } from "@/lib/prisma";
import { isTrainingSessionsComplete } from "@/lib/session-display";

export async function syncTrainingCompletionSideEffects(trainingId: string) {
  const sessions = await prisma.session.findMany({
    where: { trainingId },
    select: { status: true, endDatetime: true },
  });

  if (!isTrainingSessionsComplete(sessions)) return;

  const { maybeCreateTrainingCompletedPosts } = await import("@/lib/training-system-posts");
  await maybeCreateTrainingCompletedPosts(trainingId);

  const { maybeAutoUnlockCertificatesForTraining } = await import(
    "@/lib/certificate-auto-unlock"
  );
  await maybeAutoUnlockCertificatesForTraining(trainingId);
}

/** @deprecated Use syncTrainingCompletionSideEffects */
export async function syncSessionStatusInDb(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { trainingId: true },
  });
  if (!session) return;
  await syncTrainingCompletionSideEffects(session.trainingId);
}
