import { cache } from "react";
import { ProjectRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CoordinatorProjectRole = {
  id: string;
  canManageSessions: boolean;
  canAddParticipants: boolean;
  canUnlockCertificates: boolean;
  canPublishFeed: boolean;
  projectCompanyId: string;
};

export const getCoordinatorProjectRole = cache(
  async (userId: string, projectId: string): Promise<CoordinatorProjectRole | null> => {
    const role = await prisma.userProjectRole.findFirst({
      where: { userId, projectId, role: ProjectRole.COORDINATOR },
      select: {
        id: true,
        canManageSessions: true,
        canAddParticipants: true,
        canUnlockCertificates: true,
        canPublishFeed: true,
        project: { select: { companyId: true } },
      },
    });

    if (!role) return null;

    return {
      id: role.id,
      canManageSessions: role.canManageSessions,
      canAddParticipants: role.canAddParticipants,
      canUnlockCertificates: role.canUnlockCertificates,
      canPublishFeed: role.canPublishFeed,
      projectCompanyId: role.project.companyId,
    };
  }
);

export async function ensureCoordinatorProjectAccess(
  userId: string,
  projectId: string,
  userCompanyId?: string
) {
  const role = await getCoordinatorProjectRole(userId, projectId);
  if (!role) return true;

  const companyId =
    userCompanyId ??
    (
      await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      })
    )?.companyId;

  if (!companyId || companyId === role.projectCompanyId) return true;

  await prisma.userProjectRole.delete({ where: { id: role.id } });
  return false;
}
