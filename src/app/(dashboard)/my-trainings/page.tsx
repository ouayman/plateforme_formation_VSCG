import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require";
import { getActiveCompanyId } from "@/lib/active-company";
import { getParticipantTrainings } from "@/lib/participant";
import { mapParticipantUiData } from "@/lib/participant-ui";
import { isParticipantOnly } from "@/lib/permissions";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { ParticipantFormationsView } from "@/components/features/participant/participant-formations-view";

export default async function MyTrainingsPage() {
  const user = await requireAuth();
  const activeCompanyId = await getActiveCompanyId(user.id);
  const trainings = await getParticipantTrainings(user.id, activeCompanyId);

  if (trainings.length === 0) {
    const participantOnly = await isParticipantOnly(user.id, user.permissions);
    if (!participantOnly) redirect("/dashboard");
  }

  const { formationRows, upcomingSessions } = mapParticipantUiData(trainings);

  return (
    <>
      <SetBreadcrumb items={[{ label: "Mes formations" }]} />
      <ParticipantFormationsView
        firstName={user.firstName}
        trainings={formationRows}
        upcomingSessions={upcomingSessions}
      />
    </>
  );
}
