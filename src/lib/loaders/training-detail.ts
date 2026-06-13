import "server-only";

import {
  AttendanceStatus,
  SessionStatus,
} from "@prisma/client";
import { getCachedTrainersList } from "@/lib/cache/trainers-list";
import { prisma } from "@/lib/prisma";
import type { getCurrentUser } from "@/lib/auth/get-current-user";

type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function trainingDetailSelect(userId: string) {
  return {
    id: true,
    title: true,
    programId: true,
    program: {
      select: {
        id: true,
        name: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            company: { select: { name: true } },
          },
        },
      },
    },
    participants: {
      where: { userId, deletedAt: null },
      select: { id: true },
      take: 1,
    },
    sessions: {
      orderBy: { startDatetime: "asc" as const },
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
        status: true,
        location: { select: { name: true, address: true, instructions: true } },
        trainer: { select: { firstName: true, lastName: true } },
        trainers: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        participants: {
          where: { userId },
          select: { attendanceStatus: true },
        },
      },
    },
    certificates: {
      where: { userId },
      select: { status: true },
    },
  };
}

export type TrainingDetailRecord = NonNullable<
  Awaited<ReturnType<typeof loadTrainingRecord>>
>;

export async function loadTrainingRecord(trainingId: string, userId: string) {
  return prisma.training.findUnique({
    where: { id: trainingId },
    select: trainingDetailSelect(userId),
  });
}

export function hasPresentAttendance(
  sessions: {
    status: SessionStatus;
    participants: { attendanceStatus: AttendanceStatus | null }[];
  }[]
) {
  return sessions.some(
    (session) =>
      session.status !== SessionStatus.cancelled &&
      session.participants[0]?.attendanceStatus === AttendanceStatus.present
  );
}

export async function loadTrainingSecondaryData(input: {
  trainingId: string;
  trainingDbId: string;
  programId: string;
  projectId: string;
  user: AuthUser;
  showFeedbackPanel: boolean;
  canManageSessions: boolean;
  canManageCertificates: boolean;
  canManageParticipants: boolean;
}) {
  const {
    trainingId,
    trainingDbId,
    programId,
    projectId,
    user,
    showFeedbackPanel,
    canManageSessions,
    canManageCertificates,
    canManageParticipants,
  } = input;

  return Promise.all([
    showFeedbackPanel
      ? prisma.feedback.findUnique({
          where: {
            trainingId_userId: { userId: user.id, trainingId },
          },
          select: { rating: true, comment: true },
        })
      : Promise.resolve(null),
    showFeedbackPanel
      ? Promise.resolve([])
      : prisma.feedback.findMany({
          where: { trainingId },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
    canManageSessions
      ? getCachedTrainersList()
      : Promise.resolve([]),
    canManageSessions
      ? prisma.projectLocation.findMany({
          where: { projectId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    canManageCertificates
      ? prisma.certificate.findMany({
          where: { trainingId: trainingDbId },
          select: {
            userId: true,
            status: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { user: { lastName: "asc" } },
        })
      : Promise.resolve([]),
    canManageCertificates
      ? prisma.sessionParticipant.findMany({
          where: {
            session: {
              trainingId: trainingDbId,
              status: { not: SessionStatus.cancelled },
            },
          },
          select: { userId: true, attendanceStatus: true },
        })
      : Promise.resolve([]),
    canManageParticipants
      ? prisma.userProgram.findMany({
          where: { programId },
          select: {
            userId: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { user: { lastName: "asc" } },
        })
      : Promise.resolve([]),
  ] as const);
}
