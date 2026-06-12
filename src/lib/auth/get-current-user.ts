import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getUserPermissions } from "@/lib/permissions";

export async function getCurrentUser() {
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

  const permissions = await getUserPermissions(user.id);

  return { ...user, permissions };
}
