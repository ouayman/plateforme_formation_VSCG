import "server-only";

import { UserType } from "@prisma/client";
import type { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  companyOptionsFromClientUser,
  resolveActiveCompanyId,
  type ClientCompanyUser,
} from "@/lib/active-company";
import { getParticipantTrainings } from "@/lib/participant";
import { isParticipantOnly, resolveParticipantOnlyFast } from "@/lib/permissions";

type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function loadMyTrainingsPageData(user: AuthUser) {
  const participantFast = resolveParticipantOnlyFast(user.permissions);
  const activeCompanyId =
    user.type === UserType.client
      ? resolveActiveCompanyId(
          user as ClientCompanyUser,
          companyOptionsFromClientUser(user as ClientCompanyUser)
        )
      : null;

  const [trainings, participantOnly] = await Promise.all([
    getParticipantTrainings(user.id, activeCompanyId),
    participantFast !== null
      ? participantFast
      : isParticipantOnly(user.id, user.permissions),
  ]);

  return { trainings, participantOnly };
}
