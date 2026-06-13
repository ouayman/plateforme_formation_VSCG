import { cache } from "react";
import { UserType } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { buildUserPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const clientCompaniesSelect = {
  companies: {
    select: { company: { select: { id: true, name: true, type: true } } },
  },
} as const;

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const [user, projectRoles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        type: true,
        companyId: true,
        avatarUrl: true,
        company: {
          select: {
            id: true,
            name: true,
            type: true,
            logoUrl: true,
          },
        },
        globalRoles: { select: { role: true } },
      },
    }),
    prisma.userProjectRole.findMany({
      where: { userId: session.userId },
      select: { projectId: true, role: true },
    }),
  ]);

  if (!user) return null;

  const companies =
    user.type === UserType.client
      ? (
          await prisma.user.findUnique({
            where: { id: user.id },
            select: clientCompaniesSelect,
          })
        )?.companies ?? []
      : [];

  const permissions = buildUserPermissions(user.type, user.globalRoles, projectRoles);

  return { ...user, companies, permissions };
});
