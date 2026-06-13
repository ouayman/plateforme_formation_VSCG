import "server-only";

import { prisma } from "@/lib/prisma";
import { projectListFilter, type UserPermissions } from "@/lib/permissions";

export async function loadDashboardStats(userId: string, permissions: UserPermissions) {
  const projectFilter = projectListFilter(userId, permissions);

  return Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.session.count({
      where: {
        startDatetime: { gte: new Date() },
        training: { program: { project: projectFilter } },
      },
    }),
    prisma.userProgram.count({
      where: { program: { project: projectFilter } },
    }),
  ] as const);
}
