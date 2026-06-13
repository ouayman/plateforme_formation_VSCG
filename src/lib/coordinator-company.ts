import { ProjectRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getCoordinatorAssignmentGroups(userId: string) {
  const roles = await prisma.userProjectRole.findMany({
    where: { userId, role: ProjectRole.COORDINATOR },
    include: {
      project: {
        select: {
          company: { select: { id: true, name: true } },
        },
      },
    },
  });

  const groups = new Map<string, { companyId: string; companyName: string; projectCount: number }>();
  for (const role of roles) {
    const company = role.project.company;
    const existing = groups.get(company.id);
    if (existing) {
      existing.projectCount += 1;
    } else {
      groups.set(company.id, {
        companyId: company.id,
        companyName: company.name,
        projectCount: 1,
      });
    }
  }

  return Array.from(groups.values());
}

export async function revokeInvalidCoordinatorRoles(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  if (!user) return 0;

  const roles = await prisma.userProjectRole.findMany({
    where: { userId, role: ProjectRole.COORDINATOR },
    include: { project: { select: { companyId: true } } },
  });

  const invalidIds = roles
    .filter((r) => r.project.companyId !== user.companyId)
    .map((r) => r.id);

  if (invalidIds.length === 0) return 0;

  await prisma.userProjectRole.deleteMany({ where: { id: { in: invalidIds } } });
  return invalidIds.length;
}

export { ensureCoordinatorProjectAccess } from "@/lib/coordinator-project-role";
