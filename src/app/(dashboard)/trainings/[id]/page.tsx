import { notFound, redirect } from "next/navigation";
import { AttendanceStatus, CertificateStatus, GlobalRole, SessionStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { computeAttendancePercent } from "@/lib/certificate-auto-unlock";
import {
  canAccessTrainingAsParticipant,
  canManageProgramParticipants,
  canManageTrainingSessions,
  canSubmitTrainingFeedback,
  canUnlockCertificate,
  isParticipantOnly,
  isStaff,
} from "@/lib/permissions";
import { isUserAssignedToTraining } from "@/lib/user-training";
import { participantRoutes } from "@/lib/routes";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { TrainingFeedView } from "@/components/features/training-feed/training-feed-view";
import {
  canPublishTrainingFeed,
  isStaffFeedViewer,
  postAuthorInclude,
  serializeTrainingPost,
  trainingPostVisibilityFilter,
} from "@/lib/training-feed";

export default async function TrainingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  const viewerProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarUrl: true },
  });
  const participantOnly = await isParticipantOnly(user.id);

  if (!(await canAccessTrainingAsParticipant(user.id, params.id))) {
    redirect(participantOnly ? participantRoutes.trainings : "/projects");
  }

  const training = await prisma.training.findUnique({
    where: { id: params.id },
    include: {
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
        orderBy: { startDatetime: "asc" },
        include: {
          location: { select: { name: true, address: true, instructions: true } },
          trainer: { select: { firstName: true, lastName: true } },
          trainers: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          participants: {
            where: { userId: user.id },
            select: { attendanceStatus: true },
          },
        },
      },
      certificates: {
        where: { userId: user.id },
        select: { status: true },
      },
    },
  });

  if (!training) notFound();

  const assigned = await isUserAssignedToTraining(user.id, params.id);
  const showFeedbackPanel =
    assigned && (participantOnly || !isStaff(user.permissions));
  const canSubmitFeedback =
    assigned && (await canSubmitTrainingFeedback(user.id, params.id));

  const feedback = showFeedbackPanel
    ? await prisma.feedback.findUnique({
        where: {
          trainingId_userId: { userId: user.id, trainingId: params.id },
        },
        select: { rating: true, comment: true },
      })
    : null;

  const allFeedbacks = showFeedbackPanel
    ? []
    : await prisma.feedback.findMany({
        where: { trainingId: params.id },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

  const staffView = await isStaffFeedViewer(user.id);
  const canPublish = await canPublishTrainingFeed(user.id, training.program.projectId);
  const canModerate = canPublish || user.permissions.isAdmin;

  const canManageCertificates = await canUnlockCertificate(
    user.id,
    training.program.projectId
  );
  const canManageParticipants = await canManageProgramParticipants(
    user.id,
    training.program.projectId
  );
  const canManageSessions = await canManageTrainingSessions(
    user.id,
    training.program.projectId
  );

  const [sessionTrainers, sessionLocations] = canManageSessions
    ? await Promise.all([
        prisma.user.findMany({
          where: { globalRoles: { some: { role: GlobalRole.TRAINER } } },
          select: { id: true, firstName: true, lastName: true },
          orderBy: { lastName: "asc" },
        }),
        prisma.projectLocation.findMany({
          where: { projectId: training.program.projectId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
      ])
    : [[], []];

  const certificates = canManageCertificates
    ? await prisma.certificate.findMany({
        where: {
          trainingId: training.id,
          user: {
            trainings: {
              some: { trainingId: training.id, deletedAt: null },
            },
          },
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { user: { lastName: "asc" } },
      })
    : [];

  const sessionsForAttendance = canManageCertificates
    ? await prisma.session.findMany({
        where: {
          trainingId: training.id,
          status: { not: SessionStatus.cancelled },
        },
        select: {
          participants: { select: { userId: true, attendanceStatus: true } },
        },
      })
    : [];

  function getAttendancePercent(userId: string) {
    const rows = sessionsForAttendance.map((session) => ({
      attendanceStatus:
        session.participants.find((p) => p.userId === userId)?.attendanceStatus ?? null,
    }));
    return computeAttendancePercent(rows);
  }

  const assignedIds = new Set(certificates.map((c) => c.userId));
  const programPool = canManageParticipants
    ? await prisma.userProgram.findMany({
        where: { programId: training.programId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { user: { lastName: "asc" } },
      })
    : [];
  const availableParticipants = programPool
    .filter((p) => !assignedIds.has(p.userId))
    .map((p) => p.user);

  const posts = await prisma.trainingPost.findMany({
    where: {
      trainingId: training.id,
      ...trainingPostVisibilityFilter(user.id, staffView),
    },
    include: postAuthorInclude,
    orderBy: { createdAt: "desc" },
  });

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

  const certificate = training.certificates[0];
  const certificateStatus =
    certificate?.status === CertificateStatus.unlocked ? "unlocked" : "locked";

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

    return {
      id: s.id,
      startDatetime: s.startDatetime.toISOString(),
      endDatetime: s.endDatetime.toISOString(),
      status: s.status,
      locationName: s.location?.name ?? null,
      address: s.location?.address ?? null,
      locationInstructions: s.location?.instructions ?? null,
      attendanceStatus: (s.participants[0]?.attendanceStatus ?? null) as
        | "present"
        | "absent"
        | null,
      trainers,
    };
  });

  return (
    <div>
      <SetBreadcrumb items={breadcrumb} />
      <TrainingFeedView
        trainingId={training.id}
        programId={training.programId}
        title={training.title}
        programName={training.program.name}
        posts={posts.map((p) => serializeTrainingPost(p, user.id))}
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
        certificates={certificates.map((c) => ({
          userId: c.userId,
          status: c.status as "locked" | "unlocked",
          attendancePercent: getAttendancePercent(c.userId),
          user: c.user,
        }))}
        availableParticipants={availableParticipants}
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
          avatarUrl: viewerProfile?.avatarUrl ?? null,
        }}
      />
    </div>
  );
}
