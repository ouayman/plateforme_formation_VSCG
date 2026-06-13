import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AttendanceStatus, CertificateStatus, GlobalRole, SessionStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { computeAttendancePercent } from "@/lib/attendance-percent";
import {
  canAccessTrainingWithProject,
  canManageProgramParticipants,
  canManageTrainingSessions,
  canManualUnlockCertificate,
  canSubmitTrainingFeedback,
  isParticipantOnly,
  isStaff,
  resolveParticipantOnlyFast,
} from "@/lib/permissions";
import { isUserAssignedToTraining } from "@/lib/user-training";
import { participantRoutes } from "@/lib/routes";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { TrainingFeedView } from "@/components/features/training-feed/training-feed-view";
import { TrainingFeedProvider } from "@/components/features/training-feed/training-feed-context";
import { TrainingFeedPostsLoader } from "@/components/features/training-feed/training-feed-posts-loader";
import { FeedPostsSkeleton } from "@/components/features/training-feed/feed-posts-skeleton";
import {
  canPublishTrainingFeed,
} from "@/lib/training-feed";

function trainingInclude(userId: string) {
  return {
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

export default async function TrainingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();

  const participantFast = resolveParticipantOnlyFast(user.permissions);

  const [participantOnly, training] = await Promise.all([
    participantFast !== null
      ? participantFast
      : isParticipantOnly(user.id, user.permissions),
    prisma.training.findUnique({
      where: { id: params.id },
      include: trainingInclude(user.id),
    }),
  ]);

  if (!training) notFound();

  const hasAccess = await canAccessTrainingWithProject(
    user.id,
    params.id,
    training.program.projectId,
    user.permissions
  );
  if (!hasAccess) {
    redirect(participantOnly ? participantRoutes.trainings : "/projects");
  }

  const projectId = training.program.projectId;
  const staffView = isStaff(user.permissions) || user.permissions.isTrainer;

  const [
    assigned,
    canPublish,
    canManageCertificates,
    canManageParticipants,
    canManageSessions,
  ] = await Promise.all([
    isUserAssignedToTraining(user.id, params.id),
    canPublishTrainingFeed(user.id, projectId, user.permissions),
    canManualUnlockCertificate(user.id, projectId, user.permissions, user.companyId),
    canManageProgramParticipants(user.id, projectId, user.permissions, user.companyId),
    canManageTrainingSessions(user.id, projectId, user.permissions),
  ]);

  const showFeedbackPanel =
    assigned && (participantOnly || !isStaff(user.permissions));
  const canModerate = canPublish || user.permissions.isAdmin;

  const [
    canSubmitFeedback,
    feedback,
    allFeedbacks,
    sessionTrainers,
    sessionLocations,
    certificates,
    sessionsForAttendance,
    programPool,
  ] = await Promise.all([
    showFeedbackPanel
      ? canSubmitTrainingFeedback(user.id, params.id)
      : Promise.resolve(false),
    showFeedbackPanel
      ? prisma.feedback.findUnique({
          where: {
            trainingId_userId: { userId: user.id, trainingId: params.id },
          },
          select: { rating: true, comment: true },
        })
      : Promise.resolve(null),
    showFeedbackPanel
      ? Promise.resolve([])
      : prisma.feedback.findMany({
          where: { trainingId: params.id },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
    canManageSessions
      ? prisma.user.findMany({
          where: { globalRoles: { some: { role: GlobalRole.TRAINER } } },
          select: { id: true, firstName: true, lastName: true },
          orderBy: { lastName: "asc" },
        })
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
          where: { trainingId: training.id },
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
              trainingId: training.id,
              status: { not: SessionStatus.cancelled },
            },
          },
          select: { userId: true, attendanceStatus: true },
        })
      : Promise.resolve([]),
    canManageParticipants
      ? prisma.userProgram.findMany({
          where: { programId: training.programId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { user: { lastName: "asc" } },
        })
      : Promise.resolve([]),
  ]);

  function getAttendancePercent(userId: string) {
    const rows = sessionsForAttendance
      .filter((row) => row.userId === userId)
      .map((row) => ({ attendanceStatus: row.attendanceStatus }));
    return computeAttendancePercent(rows);
  }

  const assignedIds = new Set(certificates.map((c) => c.userId));
  const availableParticipants = programPool
    .filter((p) => !assignedIds.has(p.userId))
    .map((p) => p.user);

  const certificate = training.certificates[0];
  const certificateStatus =
    certificate?.status === CertificateStatus.unlocked ? "unlocked" : "locked";

  const now = new Date();
  const progressSessions = canManageSessions
    ? training.sessions
    : training.sessions.filter((s) => s.status === SessionStatus.confirmed);
  const pastSessions = progressSessions.filter((s) => s.endDatetime < now);
  const attendedCount = pastSessions.filter(
    (s) => s.participants[0]?.attendanceStatus === AttendanceStatus.present
  ).length;

  const progress = {
    sessionProgress:
      progressSessions.length > 0
        ? Math.round((pastSessions.length / progressSessions.length) * 100)
        : 0,
    attendanceProgress:
      pastSessions.length > 0 ? Math.round((attendedCount / pastSessions.length) * 100) : 0,
    completedSessions: pastSessions.length,
    totalSessions: progressSessions.length,
    attendedSessions: attendedCount,
  };

  const breadcrumb = participantOnly
    ? [
        { label: "Mes formations", href: participantRoutes.trainings },
        { label: training.title },
      ]
    : [
        { label: "Projets", href: "/projects" },
        { label: training.program.project.name, href: `/projects/${training.program.projectId}` },
        {
          label: training.program.name,
          href: `/projects/${training.program.projectId}/programs/${training.program.id}`,
        },
        { label: training.title },
      ];

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

  return (
    <div>
      <SetBreadcrumb items={breadcrumb} />
      <TrainingFeedProvider
        initialCertificates={certificates.map((c) => ({
          userId: c.userId,
          status: c.status as "locked" | "unlocked",
          attendancePercent: getAttendancePercent(c.userId),
          user: c.user,
        }))}
        initialAvailableParticipants={availableParticipants}
      >
        <TrainingFeedView
          trainingId={training.id}
          programId={training.programId}
          title={training.title}
          programName={training.program.name}
          postsSlot={
            <Suspense fallback={<FeedPostsSkeleton />}>
              <TrainingFeedPostsLoader
                trainingId={training.id}
                userId={user.id}
                staffView={staffView}
              />
            </Suspense>
          }
          canPublish={canPublish}
          canModerate={canModerate}
          isAdmin={user.permissions.isAdmin}
          showFeedbackPanel={showFeedbackPanel}
          canSubmitFeedback={canSubmitFeedback}
          showFeedbackList={!showFeedbackPanel}
          allFeedbacks={allFeedbacks.map((f) => ({
            id: f.id,
            rating: f.rating,
            comment: f.comment,
            createdAt: f.createdAt.toISOString(),
            user: f.user,
          }))}
          hasFeedback={!!feedback}
          myFeedback={feedback}
          certificateStatus={assigned ? certificateStatus : null}
          canManageCertificates={canManageCertificates}
          canManageParticipants={canManageParticipants}
          sessions={feedSessions}
          showSessionAttendance={assigned && !staffView}
          canManageSessions={canManageSessions}
          sessionTrainers={sessionTrainers}
          sessionLocations={sessionLocations}
          sessionProjectMeta={{
            companyName: training.program.project.company.name,
            projectName: training.program.project.name,
            programName: training.program.name,
          }}
          progressMode={assigned ? "participant" : "sessions"}
          progress={progress}
          user={{
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
          }}
        />
      </TrainingFeedProvider>
    </div>
  );
}
