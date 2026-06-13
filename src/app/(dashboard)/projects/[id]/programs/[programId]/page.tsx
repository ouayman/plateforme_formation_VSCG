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

  const [participantOnly, allowed] = await Promise.all([
    isParticipantOnly(user.id, user.permissions),
    canAccessProgram(user.id, params.programId, user.permissions),
  ]);

  if (!allowed) redirect("/projects");
  if (participantOnly) redirect(participantRoutes.trainings);

  const [program, canEditStaff, canManageParticipants, canViewFeedbacks] =
    await Promise.all([
      prisma.program.findUnique({
        where: { id: params.programId, projectId: params.id },
        select: {
          id: true,
          name: true,
          orderIndex: true,
          project: {
            select: {
              name: true,
              companyId: true,
            },
          },
          trainings: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              orderIndex: true,
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
                select: { _count: { select: { attachments: true } } },
              },
            },
          },
          _count: { select: { participants: true } },
        },
      }),
      canManageProjects(user.id, user.permissions),
      canManageProgramParticipants(user.id, params.id, user.permissions),
      canViewAllFeedbacks(user.id, params.id, user.permissions),
    ]);

  if (!program) notFound();

  const needsParticipantsData = canManageParticipants || canViewFeedbacks;

  const [participantsRows, programFeedbacks, userTrainingRows] = await Promise.all([
    needsParticipantsData
      ? prisma.userProgram.findMany({
          where: { programId: params.programId },
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { user: { lastName: "asc" } },
        })
      : Promise.resolve([]),
    canViewFeedbacks
      ? prisma.feedback.findMany({
          where: { training: { programId: params.programId } },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            training: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    needsParticipantsData
      ? prisma.userTraining.findMany({
          where: {
            deletedAt: null,
            training: { programId: params.programId },
          },
          select: {
            userId: true,
            training: { select: { id: true, title: true, orderIndex: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const trainingsByUserId = new Map<
    string,
    { id: string; title: string; orderIndex: number }[]
  >();
  for (const row of userTrainingRows) {
    const list = trainingsByUserId.get(row.userId) ?? [];
    list.push(row.training);
    trainingsByUserId.set(row.userId, list);
  }

  const nextOrder =
    program.trainings.length > 0
      ? Math.max(...program.trainings.map((t) => t.orderIndex)) + 1
      : 0;

  const participants = participantsRows.map((p) => ({
    id: p.id,
    userId: p.userId,
    user: {
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      email: p.user.email,
    },
    trainings: (trainingsByUserId.get(p.userId) ?? []).sort(
      (a, b) => a.orderIndex - b.orderIndex
    ),
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
            {program._count.participants} participant
            {program._count.participants !== 1 ? "s" : ""}
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
        allFeedbacks={programFeedbacks.map((f) => ({
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
