import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { CertificateStatus, SessionStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth/require";
import { computeAttendancePercent } from "@/lib/attendance-percent";
import {
  hasPresentAttendance,
  loadTrainingRecord,
  loadTrainingSecondaryData,
} from "@/lib/loaders/training-detail";
import {
  canAccessTrainingWithProject,
  canManageProgramParticipants,
  canManageTrainingSessions,
  canManualUnlockCertificate,
  isParticipantOnly,
  isStaff,
  resolveParticipantOnlyFast,
} from "@/lib/permissions";
import { participantRoutes } from "@/lib/routes";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { TrainingFeedView } from "@/components/features/training-feed/training-feed-view";
import { TrainingFeedProvider } from "@/components/features/training-feed/training-feed-context";
import { TrainingFeedPostsLoader } from "@/components/features/training-feed/training-feed-posts-loader";
import { FeedPostsSkeleton } from "@/components/features/training-feed/feed-posts-skeleton";
import { canPublishTrainingFeed } from "@/lib/training-feed";

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
    loadTrainingRecord(params.id, user.id),
  ]);

  if (!training) notFound();

  const assigned = training.participants.length > 0;
  const projectId = training.program.projectId;

  const [
    hasAccess,
    canPublish,
    canManageCertificates,
    canManageParticipants,
    canManageSessions,
  ] = await Promise.all([
    canAccessTrainingWithProject(
      user.id,
      params.id,
      projectId,
      user.permissions,
      { isAssigned: assigned }
    ),
    canPublishTrainingFeed(user.id, projectId, user.permissions),
    canManualUnlockCertificate(user.id, projectId, user.permissions, user.companyId),
    canManageProgramParticipants(user.id, projectId, user.permissions, user.companyId),
    canManageTrainingSessions(user.id, projectId, user.permissions),
  ]);

  if (!hasAccess) {
    redirect(participantOnly ? participantRoutes.trainings : "/projects");
  }

  const staffView = isStaff(user.permissions) || user.permissions.isTrainer;
  const showFeedbackPanel =
    assigned && (participantOnly || !isStaff(user.permissions));
  const canModerate = canPublish || user.permissions.isAdmin;
  const canSubmitFeedback =
    showFeedbackPanel && assigned && hasPresentAttendance(training.sessions);

  const [
    feedback,
    allFeedbacks,
    sessionTrainers,
    sessionLocations,
    certificates,
    sessionsForAttendance,
    programPool,
  ] = await loadTrainingSecondaryData({
    trainingId: params.id,
    trainingDbId: training.id,
    programId: training.programId,
    projectId,
    user,
    showFeedbackPanel,
    canManageSessions,
    canManageCertificates,
    canManageParticipants,
  });

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
    (s) => s.participants[0]?.attendanceStatus === "present"
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
