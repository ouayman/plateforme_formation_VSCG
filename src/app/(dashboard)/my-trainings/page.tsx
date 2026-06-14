import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require";
import { loadMyTrainingsPageData } from "@/lib/loaders/my-trainings";
import { staffRoutes } from "@/lib/routes";
import { mapParticipantUiData } from "@/lib/participant-ui";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { ParticipantFormationsView } from "@/components/features/participant/participant-formations-view";

export default async function MyTrainingsPage() {
  const user = await requireAuth();
  const { trainings, participantOnly } = await loadMyTrainingsPageData(user);

  if (trainings.length === 0 && !participantOnly) {
    redirect(staffRoutes.home);
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
