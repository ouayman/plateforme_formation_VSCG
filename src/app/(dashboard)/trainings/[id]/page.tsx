import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require";
import { loadTrainingPageData } from "@/lib/loaders/training-detail";
import { participantRoutes } from "@/lib/routes";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { TrainingFeedView } from "@/components/features/training-feed/training-feed-view";
import { TrainingFeedProvider } from "@/components/features/training-feed/training-feed-context";
import { TrainingFeedPostsLoader } from "@/components/features/training-feed/training-feed-posts-loader";
import { FeedPostsSkeleton } from "@/components/features/training-feed/feed-posts-skeleton";

export default async function TrainingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  const data = await loadTrainingPageData(params.id, user);

  if (data.kind === "not_found") notFound();
  if (data.kind === "forbidden") {
    redirect(data.participantOnly ? participantRoutes.trainings : "/projects");
  }

  const {
    training,
    participantOnly,
    staffView,
    showFeedbackPanel,
    canModerate,
    canSubmitFeedback,
    pagePerms,
    feedback,
    allFeedbacks,
    sessionTrainers,
    sessionLocations,
    certificates,
    certificateStatus,
    assigned,
    progress,
    feedSessions,
    getAttendancePercent,
    availableParticipants,
  } = data;

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
          canPublish={pagePerms.canPublish}
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
          certificateStatus={certificateStatus}
          canManageCertificates={pagePerms.canManageCertificates}
          canManageParticipants={pagePerms.canManageParticipants}
          sessions={feedSessions}
          showSessionAttendance={assigned && !staffView}
          canManageSessions={pagePerms.canManageSessions}
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
