import { redirect } from "next/navigation";
import { ProjectRole, SessionStatus } from "@prisma/client";
import { CalendarDays } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import { getActiveCompanyId } from "@/lib/active-company";
import { prisma } from "@/lib/prisma";
import { getParticipantTrainings } from "@/lib/participant";
import { mapParticipantUiData } from "@/lib/participant-ui";
import { isParticipantOnly, isStaff } from "@/lib/permissions";
import { countLabel } from "@/lib/format";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { PageHeader } from "@/components/layout/page-header";
import { SectionBlock } from "@/components/layout/section-block";
import { TrainerScheduleCalendar } from "@/components/features/planning/trainer-schedule-calendar";
import {
  TrainerPlanningHeaderAction,
  TrainerPlanningProvider,
} from "@/components/features/planning/trainer-planning-context";
import { ParticipantPlanningView } from "@/components/features/participant/participant-planning-view";

export default async function PlanningPage() {
  const user = await requireAuth();

  if (await isParticipantOnly(user.id)) {
    const activeCompanyId = await getActiveCompanyId(user.id);
    const trainings = await getParticipantTrainings(user.id, activeCompanyId);
    const { calendarSessions, upcomingSessions } = mapParticipantUiData(trainings);

    return (
      <ParticipantPlanningView
        firstName={user.firstName}
        sessions={calendarSessions}
        upcomingSessions={upcomingSessions}
      />
    );
  }

  const perms = user.permissions;
  const isStaffUser = isStaff(perms);

  if (!perms.isTrainer && !isStaffUser) {
    const trainerProjectIds = perms.projectRoles
      .filter((r) => r.role === ProjectRole.TRAINER)
      .map((r) => r.projectId);

    if (trainerProjectIds.length === 0) {
      const assigned = await prisma.session.findFirst({
        where: { trainerId: user.id },
        select: { id: true },
      });
      if (!assigned) redirect("/dashboard");
    }
  }

  const sessionFilter = perms.isTrainer
    ? {
        status: { not: SessionStatus.cancelled },
        OR: [{ trainerId: user.id }, { trainers: { some: { userId: user.id } } }],
      }
    : isStaffUser
      ? { status: { not: SessionStatus.cancelled } }
      : {
          status: { not: SessionStatus.cancelled },
          OR: [
            { trainerId: user.id },
            { trainers: { some: { userId: user.id } } },
          ],
        };

  const [sessions, unavailabilities] = await Promise.all([
    prisma.session.findMany({
      where: sessionFilter,
      orderBy: { startDatetime: "asc" },
      include: {
        location: { select: { name: true } },
        training: {
          select: {
            id: true,
            title: true,
            program: {
              select: {
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    company: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    perms.isTrainer
      ? prisma.trainerUnavailability.findMany({
          where: { userId: user.id },
          orderBy: { startDatetime: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const calendarSessions = sessions.map((session) => ({
    id: session.id,
    trainingId: session.training.id,
    startDatetime: session.startDatetime.toISOString(),
    endDatetime: session.endDatetime.toISOString(),
    trainingTitle: session.training.title,
    projectId: session.training.program.project.id,
    projectName: session.training.program.project.name,
    companyName: session.training.program.project.company.name,
  }));

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Planning" }]} />

      {perms.isTrainer ? (
        <TrainerPlanningProvider>
          <PageHeader
            icon={CalendarDays}
            iconVariant="primary"
            title="Planning"
            description="Vos sessions et indisponibilités"
            action={<TrainerPlanningHeaderAction />}
          />

          <SectionBlock
            hideTitle
            countLabel={countLabel(sessions.length, "session", "sessions")}
          >
            <TrainerScheduleCalendar
              sessions={calendarSessions}
              initialUnavailabilities={unavailabilities.map((u) => ({
                id: u.id,
                startDatetime: u.startDatetime.toISOString(),
                endDatetime: u.endDatetime.toISOString(),
              }))}
              showUnavailabilityLegend
            />
          </SectionBlock>
        </TrainerPlanningProvider>
      ) : (
        <>
          <PageHeader
            icon={CalendarDays}
            iconVariant="primary"
            title="Planning"
            description="Vue consolidée de vos sessions de formation"
          />

          <SectionBlock
            title="Mes sessions"
            countLabel={countLabel(sessions.length, "session", "sessions")}
          >
            <TrainerScheduleCalendar
              sessions={calendarSessions}
              initialUnavailabilities={[]}
              editable={false}
              showUnavailabilityLegend={false}
            />
          </SectionBlock>
        </>
      )}
    </div>
  );
}
