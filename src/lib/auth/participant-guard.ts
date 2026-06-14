import { redirect } from "next/navigation";

import { isParticipantOnly, resolveParticipantOnlyFast, type UserPermissions } from "@/lib/permissions";
import { participantRoutes } from "@/lib/routes";

type GuardUser = {
  id: string;
  permissions: UserPermissions;
};

/** Participants n'accèdent qu'à /my-trainings et /trainings/[id]. */
export async function redirectIfParticipantOnly(user: GuardUser) {
  const participantFast = resolveParticipantOnlyFast(user.permissions);
  if (participantFast === true) redirect(participantRoutes.trainings);
  if (participantFast === null && (await isParticipantOnly(user.id, user.permissions))) {
    redirect(participantRoutes.trainings);
  }
}
