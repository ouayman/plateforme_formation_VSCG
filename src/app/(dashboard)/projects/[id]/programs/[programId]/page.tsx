import { notFound, redirect } from "next/navigation";
import { SessionStatus } from "@prisma/client";
import { Route } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import {
  canAccessProgram,
  canManageProgramParticipants,
  canManageProjects,
  canViewAllFeedbacks,
  isParticipantOnly,
} from "@/lib/permissions";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { participantRoutes } from "@/lib/routes";
import { ProgramEditButton } from "@/components/features/programs/program-form-modal";
import { mapTrainingCardRow } from "@/lib/training-ui";
import { ProgramDetailTabs } from "@/components/features/programs/program-detail-tabs";
import { cn } from "@/lib/utils";

export default async function ProgramDetailPage({
  params,
}: {
  params: { id: string; programId: string };
}) {
  const user = await requireAuth();
  const allowed = await canAccessProgram(user.id, params.programId);
  if (!allowed) redirect("/projects");

  if (await isParticipantOnly(user.id)) {
    redirect(participantRoutes.trainings);
  }

  const program = await prisma.program.findUnique({
    where: { id: params.programId, projectId: params.id },
    include: {
      project: {
        select: {
          name: true,
          companyId: true,
        },
      },
      trainings: {
        orderBy: { orderIndex: "asc" },
        include: {
          _count: {
            select: {
              sessions: true,
              participants: { where: { deletedAt: null } },
            },
          },
          sessions: {
            where: { status: { not: SessionStatus.cancelled } },
            select: { startDatetime: true, endDatetime: true },
          },
          posts: {
            select: { attachments: { select: { id: true } } },
          },
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              trainings: {
                where: { deletedAt: null, training: { programId: params.programId } },
                select: {
                  training: { select: { id: true, title: true, orderIndex: true } },
                },
              },
            },
          },
        },
        orderBy: { user: { lastName: "asc" } },
      },
    },
  });

  if (!program) notFound();

  const programFeedbacks = await prisma.feedback.findMany({
    where: { training: { programId: params.programId } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      training: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const canEditStaff = await canManageProjects(user.id);
  const canManageParticipants = await canManageProgramParticipants(user.id, params.id);
  const canViewFeedbacks = await canViewAllFeedbacks(user.id, params.id);

  const nextOrder =
    program.trainings.length > 0
      ? Math.max(...program.trainings.map((t) => t.orderIndex)) + 1
      : 0;

  const visibleFeedbacks = canViewFeedbacks ? programFeedbacks : [];

  const participants = program.participants.map((p) => ({
    id: p.id,
    userId: p.userId,
    user: {
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      email: p.user.email,
    },
    trainings: p.user.trainings
      .map((t) => t.training)
      .sort((a, b) => a.orderIndex - b.orderIndex),
  }));

  const trainingCards = program.trainings.map(mapTrainingCardRow);
  const trainingOptions = program.trainings.map((t) => ({
    id: t.id,
    title: t.title,
    orderIndex: t.orderIndex,
  }));
  const feedbackTrainingOptions = trainingOptions.filter((t) =>
    programFeedbacks.some((f) => f.training?.id === t.id)
  );

  return (
    <div className="space-y-8">
      <SetBreadcrumb
        items={[
          { label: "Projets", href: "/projects" },
          { label: program.project.name, href: `/projects/${params.id}` },
          { label: program.name },
        ]}
      />

      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn("icon-badge-primary", "h-10 w-10 sm:h-11 sm:w-11")}>
          <Route className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {program.name}
            </h1>
            {canEditStaff && (
              <ProgramEditButton
                projectId={params.id}
                program={{
                  id: program.id,
                  name: program.name,
                  orderIndex: program.orderIndex,
                }}
              />
            )}
          </div>
          <p className="mt-1 text-[14px] text-muted-foreground sm:text-[15px]">
            {program.trainings.length} formation{program.trainings.length !== 1 ? "s" : ""} ·{" "}
            {program.participants.length} participant
            {program.participants.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <ProgramDetailTabs
        programId={program.id}
        canEditStaff={canEditStaff}
        canManageParticipants={canManageParticipants}
        canViewAllFeedbacks={canViewFeedbacks}
        trainings={trainingCards}
        participants={participants}
        nextOrder={nextOrder}
        allFeedbacks={visibleFeedbacks.map((f) => ({
          id: f.id,
          rating: f.rating,
          comment: f.comment,
          createdAt: f.createdAt.toISOString(),
          user: f.user,
          training: f.training,
        }))}
        feedbackTrainingOptions={feedbackTrainingOptions}
      />
    </div>
  );
}
