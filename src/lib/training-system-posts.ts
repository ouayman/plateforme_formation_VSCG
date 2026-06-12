import {
  AttendanceStatus,
  TrainingPostSystemType,
  TrainingPostType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";
import { formatDate } from "@/lib/format";
import { sessionRef } from "@/lib/training-feed-utils";
import { getActiveTrainingParticipantIds } from "@/lib/user-training";

async function systemPostExists(params: {
  trainingId: string;
  systemType: TrainingPostSystemType;
  targetUserId?: string | null;
  linkUrl?: string;
}) {
  return prisma.trainingPost.findFirst({
    where: {
      trainingId: params.trainingId,
      type: TrainingPostType.system,
      systemType: params.systemType,
      targetUserId: params.targetUserId ?? null,
      ...(params.linkUrl ? { linkUrl: params.linkUrl } : {}),
    },
    select: { id: true },
  });
}

async function createSystemPost(data: {
  trainingId: string;
  systemType: TrainingPostSystemType;
  targetUserId?: string | null;
  text: string;
  linkUrl?: string | null;
  linkTitle?: string | null;
}) {
  return prisma.trainingPost.create({
    data: {
      trainingId: data.trainingId,
      type: TrainingPostType.system,
      systemType: data.systemType,
      targetUserId: data.targetUserId ?? null,
      text: data.text,
      linkUrl: data.linkUrl ?? null,
      linkTitle: data.linkTitle ?? null,
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightRose(value: string) {
  return `<strong style="color:#CD3465">${escapeHtml(value)}</strong>`;
}

export async function createWelcomePost(trainingId: string, userId: string) {
  const exists = await systemPostExists({
    trainingId,
    systemType: TrainingPostSystemType.welcome,
    targetUserId: userId,
  });
  if (exists) return;

  const [user, training, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    }),
    prisma.training.findUnique({
      where: { id: trainingId },
      select: {
        title: true,
        program: { select: { name: true } },
      },
    }),
    getPlatformSettings(),
  ]);

  if (!user || !training) return;

  const text = [
    `Bonjour ${escapeHtml(user.firstName)} 👋,`,
    `Nous sommes ravis de vous compter parmi les participants de la formation ${highlightRose(training.title)} du programme ${highlightRose(training.program.name)}.`,
    "",
    "Retrouvez ici tous les éléments relatifs à votre formation (documents, informations pratiques, communications, etc).",
    "",
    escapeHtml(settings.welcomeSignatory) + ".",
  ].join("<br/>");

  await createSystemPost({
    trainingId,
    systemType: TrainingPostSystemType.welcome,
    targetUserId: userId,
    text,
  });
}

/** @deprecated Lot 3 — utiliser createWelcomePost par formation */
export async function createWelcomePostsForProgramUser(programId: string, userId: string) {
  const trainings = await prisma.training.findMany({
    where: { programId },
    select: { id: true },
  });

  for (const training of trainings) {
    await createWelcomePost(training.id, userId);
  }
}

export async function createAbsencePost(
  trainingId: string,
  userId: string,
  session: { id: string; startDatetime: Date }
) {
  const ref = `${sessionRef(session.id)}/absence/${userId}`;
  const exists = await systemPostExists({
    trainingId,
    systemType: TrainingPostSystemType.absence,
    targetUserId: userId,
    linkUrl: ref,
  });
  if (exists) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  await createSystemPost({
    trainingId,
    systemType: TrainingPostSystemType.absence,
    targetUserId: userId,
    text: `${user?.firstName ?? "Bonjour"}, vous avez été marqué(e) absent(e) pour la session du ${formatDate(session.startDatetime)}. Contactez votre coordinateur en cas d'erreur.`,
    linkUrl: ref,
  });
}

export async function maybeCreateTrainingCompletedPosts(trainingId: string) {
  const sessions = await prisma.session.findMany({
    where: { trainingId },
    select: { status: true, endDatetime: true },
  });

  const { isTrainingSessionsComplete } = await import("@/lib/session-display");
  if (!isTrainingSessionsComplete(sessions)) return;

  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { title: true },
  });
  if (!training) return;

  const participantIds = await getActiveTrainingParticipantIds(trainingId);

  for (const userId of participantIds) {
    const exists = await systemPostExists({
      trainingId,
      systemType: TrainingPostSystemType.training_completed,
      targetUserId: userId,
    });
    if (exists) continue;

    const [user, feedback] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } }),
      prisma.feedback.findUnique({
        where: { trainingId_userId: { trainingId, userId } },
        select: { id: true },
      }),
    ]);

    const firstName = user?.firstName ?? "Bonjour";
    const text = feedback
      ? `${firstName}, la formation « ${training.title} » est terminée. Merci pour votre participation et votre retour !`
      : `${firstName}, la formation « ${training.title} » est terminée. Merci pour votre participation ! Laissez votre avis dans la section dédiée.`;

    await createSystemPost({
      trainingId,
      systemType: TrainingPostSystemType.training_completed,
      targetUserId: userId,
      text,
      linkUrl: feedback ? null : "vscg://feedback",
      linkTitle: feedback ? null : "Donner mon avis",
    });
  }
}

export async function createCertificateAvailablePost(trainingId: string, userId: string) {
  const exists = await systemPostExists({
    trainingId,
    systemType: TrainingPostSystemType.certificate_available,
    targetUserId: userId,
  });
  if (exists) return;

  const [user, training] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } }),
    prisma.training.findUnique({ where: { id: trainingId }, select: { title: true } }),
  ]);
  if (!training) return;

  await createSystemPost({
    trainingId,
    systemType: TrainingPostSystemType.certificate_available,
    targetUserId: userId,
    text: `${user?.firstName ?? "Bonjour"}, votre attestation pour « ${training.title} » est disponible.`,
    linkUrl: `/api/trainings/${trainingId}/certificates/me/download`,
    linkTitle: "Télécharger l'attestation",
  });
}

export async function handleAttendanceSystemPosts(
  sessionId: string,
  updates: { userId: string; attendanceStatus: AttendanceStatus | null }[],
  previous: { userId: string; attendanceStatus: AttendanceStatus | null }[]
) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, trainingId: true, startDatetime: true },
  });
  if (!session) return;

  for (const update of updates) {
    if (update.attendanceStatus !== AttendanceStatus.absent) continue;
    const prev = previous.find((p) => p.userId === update.userId);
    if (prev?.attendanceStatus === AttendanceStatus.absent) continue;
    await createAbsencePost(session.trainingId, update.userId, session);
  }
}
