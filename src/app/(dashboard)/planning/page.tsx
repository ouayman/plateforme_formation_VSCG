import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import { getActiveCompanyId } from "@/lib/active-company";
import {
  loadParticipantPlanningSessions,
  loadStaffPlanningSessions,
  loadTrainerPlanningData,
  splitParticipantPlanningSessions,
  verifyTrainerPlanningAccess,
} from "@/lib/loaders/planning";
import { isParticipantOnly } from "@/lib/permissions";
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
  const perms = user.permissions;

  const participantOnly = await isParticipantOnly(user.id, perms);

  if (participantOnly) {
    const activeCompanyId = await getActiveCompanyId(user.id, user);
    const rawSessions = await loadParticipantPlanningSessions(user.id, activeCompanyId);
    const { calendarSessions, upcomingSessions } =
      splitParticipantPlanningSessions(rawSessions);

    return (
      <ParticipantPlanningView
        firstName={user.firstName}
        sessions={calendarSessions}
        upcomingSessions={upcomingSessions}
      />
    );
  }

  const hasAccess = await verifyTrainerPlanningAccess(user.id, perms);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  if (perms.isTrainer) {
    const { sessions, unavailabilities } = await loadTrainerPlanningData(user);

    return (
      <div className="space-y-8">
        <SetBreadcrumb items={[{ label: "Planning" }]} />
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
              sessions={sessions}
              initialUnavailabilities={unavailabilities}
              showUnavailabilityLegend
            />
          </SectionBlock>
        </TrainerPlanningProvider>
      </div>
    );
  }

  const sessions = await loadStaffPlanningSessions(user, perms);

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Planning" }]} />
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
          sessions={sessions}
          initialUnavailabilities={[]}
          editable={false}
          showUnavailabilityLegend={false}
        />
      </SectionBlock>
    </div>
  );
}
