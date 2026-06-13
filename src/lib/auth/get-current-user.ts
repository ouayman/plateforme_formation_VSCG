import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { buildUserPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const userSelect = {
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
    companies: {
      select: {
        company: { select: { id: true, name: true, type: true } },
      },
    },
  } as const;

  const [user, projectRoles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: userSelect,
    }),
    prisma.userProjectRole.findMany({
      where: { userId: session.userId },
      select: { projectId: true, role: true },
    }),
  ]);

  if (!user) return null;

  const permissions = buildUserPermissions(user.type, user.globalRoles, projectRoles);

  return { ...user, permissions };
});
