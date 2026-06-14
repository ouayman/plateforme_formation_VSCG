import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Route } from "lucide-react";
import { redirectIfParticipantOnly } from "@/lib/auth/participant-guard";
import { requireAuth } from "@/lib/auth/require";
import {
  countProgramFeedbacks,
  loadProgramCore,
  loadTrainingAttachmentCounts,
} from "@/lib/loaders/program-detail";
import {
  canAccessProgram,
  canManageProgramParticipants,
  canManageProjects,
  canViewAllFeedbacks,
} from "@/lib/permissions";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { PageHeader } from "@/components/layout/page-header";
import { LazyProgramEditButton as ProgramEditButton } from "@/components/features/programs/lazy-modals";
import { mapTrainingCardRow } from "@/lib/training-ui";
import { ProgramDetailTabs } from "@/components/features/programs/program-detail-tabs";
import { ProgramParticipantsPanel } from "@/components/features/programs/program-participants-panel";
import { ProgramParticipantsSkeleton } from "@/components/features/programs/program-participants-skeleton";
import { ProgramFeedbacksPanel } from "@/components/features/programs/program-feedbacks-panel";
import { ProgramFeedbacksSkeleton } from "@/components/features/programs/program-feedbacks-skeleton";

export default async function ProgramDetailPage({
  params,
}: {
  params: { id: string; programId: string };
}) {
  const user = await requireAuth();
  await redirectIfParticipantOnly(user);

  const allowed = await canAccessProgram(user.id, params.programId, user.permissions);

  if (!allowed) redirect("/projects");

  const canViewFeedbacksPromise = canViewAllFeedbacks(
    user.id,
    params.id,
    user.permissions
  );

  const [program, canEditStructure, canManageParticipants, canViewFeedbacks, feedbackCount] =
    await Promise.all([
      loadProgramCore(params.programId, params.id),
      canManageProjects(user.id, user.permissions),
      canManageProgramParticipants(user.id, params.id, user.permissions),
      canViewFeedbacksPromise,
      canViewFeedbacksPromise.then((canView) =>
        canView ? countProgramFeedbacks(params.programId) : 0
      ),
    ]);

  if (!program) notFound();

  const attachmentCounts = await loadTrainingAttachmentCounts(
    program.trainings.map((training) => training.id)
  );

  const needsParticipantsPanel = canManageParticipants || canViewFeedbacks;

  const nextOrder =
    program.trainings.length > 0
      ? Math.max(...program.trainings.map((t) => t.orderIndex)) + 1
      : 0;

  const trainingCards = program.trainings.map((training) =>
    mapTrainingCardRow({
      ...training,
      documentCount: attachmentCounts.get(training.id) ?? 0,
    })
  );
  const trainingOptions = program.trainings.map((t) => ({
    id: t.id,
    title: t.title,
    orderIndex: t.orderIndex,
  }));

  return (
    <div className="space-y-8">
      <SetBreadcrumb
        items={[
          { label: "Projets", href: "/projects" },
          { label: program.project.name, href: `/projects/${params.id}` },
          { label: program.name },
        ]}
      />

      <PageHeader
        icon={Route}
        iconVariant="primary"
        title={program.name}
        description={`${program.trainings.length} formation${program.trainings.length !== 1 ? "s" : ""} · ${program._count.participants} participant${program._count.participants !== 1 ? "s" : ""}`}
        action={
          canEditStructure ? (
            <ProgramEditButton
              projectId={params.id}
              program={{
                id: program.id,
                name: program.name,
                orderIndex: program.orderIndex,
              }}
            />
          ) : undefined
        }
      />

      <ProgramDetailTabs
        programId={program.id}
        canEditStructure={canEditStructure}
        canManageParticipants={canManageParticipants}
        canViewAllFeedbacks={canViewFeedbacks}
        trainings={trainingCards}
        nextOrder={nextOrder}
        participantCount={program._count.participants}
        feedbackCount={feedbackCount}
        participantsPanel={
          needsParticipantsPanel ? (
            <Suspense fallback={<ProgramParticipantsSkeleton />}>
              <ProgramParticipantsPanel
                programId={params.programId}
                canManageParticipants={canManageParticipants}
                trainingOptions={trainingOptions}
              />
            </Suspense>
          ) : undefined
        }
        feedbacksPanel={
          canViewFeedbacks ? (
            <Suspense fallback={<ProgramFeedbacksSkeleton />}>
              <ProgramFeedbacksPanel
                programId={params.programId}
                canViewAllFeedbacks={canViewFeedbacks}
              />
            </Suspense>
          ) : undefined
        }
      />
    </div>
  );
}
