import "server-only";

import {
  AttendanceStatus,
  CertificateStatus,
  SessionStatus,
} from "@prisma/client";
import type { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCoordinatorProjectRole } from "@/lib/coordinator-project-role";
import { getCachedTrainersList } from "@/lib/cache/trainers-list";
import { computeAttendancePercent } from "@/lib/attendance-percent";
import { prisma } from "@/lib/prisma";
import {
  deriveTrainingPagePermissions,
  hasCoordinatorRoleOnProject,
  isParticipantOnly,
  isStaff,
  resolveParticipantOnlyFast,
  resolveTrainingPageAccess,
} from "@/lib/permissions";

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
            deletedAt: true,
            companyId: true,
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

export type TrainingPageData =
  | { kind: "not_found" }
  | { kind: "forbidden"; participantOnly: boolean }
  | {
      kind: "ok";
      user: AuthUser;
      participantOnly: boolean;
      training: TrainingDetailRecord;
      assigned: boolean;
      staffView: boolean;
      showFeedbackPanel: boolean;
      canModerate: boolean;
      canSubmitFeedback: boolean;
      pagePerms: ReturnType<typeof deriveTrainingPagePermissions>;
      feedback: Awaited<ReturnType<typeof loadTrainingSecondaryData>>[0];
      allFeedbacks: Awaited<ReturnType<typeof loadTrainingSecondaryData>>[1];
      sessionTrainers: Awaited<ReturnType<typeof loadTrainingSecondaryData>>[2];
      sessionLocations: Awaited<ReturnType<typeof loadTrainingSecondaryData>>[3];
      certificates: Awaited<ReturnType<typeof loadTrainingSecondaryData>>[4];
      sessionsForAttendance: Awaited<ReturnType<typeof loadTrainingSecondaryData>>[5];
      programPool: Awaited<ReturnType<typeof loadTrainingSecondaryData>>[6];
      certificateStatus: "locked" | "unlocked" | null;
      progress: {
        sessionProgress: number;
        attendanceProgress: number;
        completedSessions: number;
        totalSessions: number;
        attendedSessions: number;
      };
      feedSessions: {
        id: string;
        startDatetime: string;
        endDatetime: string;
        status: SessionStatus;
        locationName: string | null;
        address: string | null;
        locationInstructions: string | null;
        attendanceStatus: "present" | "absent" | null;
        trainers: { firstName: string; lastName: string }[];
      }[];
      getAttendancePercent: (userId: string) => number;
      availableParticipants: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      }[];
    };

export async function loadTrainingPageData(
  trainingId: string,
  user: AuthUser
): Promise<TrainingPageData> {
  const participantFast = resolveParticipantOnlyFast(user.permissions);

  const [training, participantOnly] = await Promise.all([
    loadTrainingRecord(trainingId, user.id),
    participantFast !== null
      ? participantFast
      : isParticipantOnly(user.id, user.permissions),
  ]);

  if (!training) return { kind: "not_found" };

  const assigned = training.participants.length > 0;
  const projectId = training.program.projectId;
  const project = training.program.project;

  const hasAccess = await resolveTrainingPageAccess(user.id, {
    permissions: user.permissions,
    participantOnly,
    assigned,
    projectId,
    project: { deletedAt: project.deletedAt, companyId: project.companyId },
  });

  if (!hasAccess) {
    return { kind: "forbidden", participantOnly };
  }

  const needsCoordinator = hasCoordinatorRoleOnProject(user.permissions, projectId);
  const coordinatorRole = needsCoordinator
    ? await getCoordinatorProjectRole(user.id, projectId)
    : null;

  const pagePerms = deriveTrainingPagePermissions(
    user.permissions,
    projectId,
    coordinatorRole
  );

  const staffView = isStaff(user.permissions) || user.permissions.isTrainer;
  const showFeedbackPanel =
    assigned && (participantOnly || !isStaff(user.permissions));

  const [
    feedback,
    allFeedbacks,
    sessionTrainers,
    sessionLocations,
    certificates,
    sessionsForAttendance,
    programPool,
  ] = await loadTrainingSecondaryData({
    trainingId,
    trainingDbId: training.id,
    programId: training.programId,
    projectId,
    user,
    showFeedbackPanel,
    canManageSessions: pagePerms.canManageSessions,
    canManageCertificates: pagePerms.canManageCertificates,
    canManageParticipants: pagePerms.canManageParticipants,
  });

  function getAttendancePercent(userId: string) {
    const rows = sessionsForAttendance
      .filter((row) => row.userId === userId)
      .map((row) => ({ attendanceStatus: row.attendanceStatus }));
    return computeAttendancePercent(rows) ?? 0;
  }

  const assignedIds = new Set(certificates.map((c) => c.userId));
  const availableParticipants = programPool
    .filter((p) => !assignedIds.has(p.userId))
    .map((p) => p.user);

  const certificate = training.certificates[0];
  const certificateStatus = assigned
    ? certificate?.status === CertificateStatus.unlocked
      ? "unlocked"
      : "locked"
    : null;

  const now = new Date();
  const progressSessions = pagePerms.canManageSessions
    ? training.sessions
    : training.sessions.filter((s) => s.status === SessionStatus.confirmed);
  const pastSessions = progressSessions.filter((s) => s.endDatetime < now);
  const attendedCount = pastSessions.filter(
    (s) => s.participants[0]?.attendanceStatus === AttendanceStatus.present
  ).length;

  const feedSessions = training.sessions.map((s) => {
    const trainers =
      s.trainers.length > 0
        ? s.trainers.map((t) => t.user)
        : s.trainer
          ? [{ firstName: s.trainer.firstName, lastName: s.trainer.lastName }]
          : [];
    const myAttendance = s.participants[0];

    return {
      id: s.id,
      startDatetime: s.startDatetime.toISOString(),
      endDatetime: s.endDatetime.toISOString(),
      status: s.status,
      locationName: s.location?.name ?? null,
      address: s.location?.address ?? null,
      locationInstructions: s.location?.instructions ?? null,
      attendanceStatus: (myAttendance?.attendanceStatus ?? null) as
        | "present"
        | "absent"
        | null,
      trainers,
    };
  });

  return {
    kind: "ok",
    user,
    participantOnly,
    training,
    assigned,
    staffView,
    showFeedbackPanel,
    canModerate: pagePerms.canPublish || user.permissions.isAdmin,
    canSubmitFeedback:
      showFeedbackPanel && assigned && hasPresentAttendance(training.sessions),
    pagePerms,
    feedback,
    allFeedbacks,
    sessionTrainers,
    sessionLocations,
    certificates,
    sessionsForAttendance,
    programPool,
    certificateStatus,
    progress: {
      sessionProgress:
        progressSessions.length > 0
          ? Math.round((pastSessions.length / progressSessions.length) * 100)
          : 0,
      attendanceProgress:
        pastSessions.length > 0
          ? Math.round((attendedCount / pastSessions.length) * 100)
          : 0,
      completedSessions: pastSessions.length,
      totalSessions: progressSessions.length,
      attendedSessions: attendedCount,
    },
    feedSessions,
    getAttendancePercent,
    availableParticipants,
  };
}
