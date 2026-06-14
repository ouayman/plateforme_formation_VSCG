import "server-only";

import {
  buildUserPermissions,
  isParticipantOnly,
  resolveParticipantOnlyFast,
  type UserPermissions,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { participantRoutes, staffRoutes } from "@/lib/routes";

async function resolveLandingPathFromPermissions(
  userId: string,
  permissions: UserPermissions
): Promise<string> {
  const participantFast = resolveParticipantOnlyFast(permissions);
  if (participantFast === true) return participantRoutes.trainings;
  if (participantFast === false) return staffRoutes.home;
  if (await isParticipantOnly(userId, permissions)) return participantRoutes.trainings;
  return staffRoutes.home;
}

export async function resolveLandingPath(userId: string): Promise<string> {
  const [user, projectRoles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { type: true, globalRoles: { select: { role: true } } },
    }),
    prisma.userProjectRole.findMany({
      where: { userId },
      select: { projectId: true, role: true },
    }),
  ]);

  if (!user) return staffRoutes.home;

  const permissions = buildUserPermissions(user.type, user.globalRoles, projectRoles);
  return resolveLandingPathFromPermissions(userId, permissions);
}

export async function resolveLandingPathFromUser(user: {
  id: string;
  permissions: UserPermissions;
}): Promise<string> {
  return resolveLandingPathFromPermissions(user.id, user.permissions);
}
