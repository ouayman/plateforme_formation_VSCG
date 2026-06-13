import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { buildUserPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      company: true,
      globalRoles: true,
    },
  });

  if (!user) return null;

  const projectRoles = await prisma.userProjectRole.findMany({
    where: { userId: user.id },
  });

  const permissions = buildUserPermissions(user.type, user.globalRoles, projectRoles);

  return { ...user, permissions };
});
