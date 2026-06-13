import "server-only";

import { getCachedClientCompanies } from "@/lib/cache/client-companies";
import { prisma } from "@/lib/prisma";
import { projectListFilter, type UserPermissions } from "@/lib/permissions";

const projectListSelect = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  deletedAt: true,
  company: { select: { name: true } },
  _count: { select: { programs: true } },
} as const;

export async function loadProjectsPageData(
  userId: string,
  permissions: UserPermissions,
  canEdit: boolean
) {
  const activeFilter = projectListFilter(userId, permissions);

  return Promise.all([
    prisma.project.findMany({
      where: activeFilter,
      orderBy: { startDate: "desc" },
      select: projectListSelect,
    }),
    canEdit
      ? prisma.project.findMany({
          where: projectListFilter(userId, permissions, { deletedOnly: true }),
          orderBy: { deletedAt: "desc" },
          select: projectListSelect,
        })
      : Promise.resolve([]),
    canEdit
      ? getCachedClientCompanies()
      : Promise.resolve([]),
  ] as const);
}

export function serializeProjectListItem(project: {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  deletedAt: Date | null;
  company: { name: string };
  _count: { programs: number };
}) {
  return {
    id: project.id,
    name: project.name,
    startDate: project.startDate.toISOString(),
    endDate: project.endDate.toISOString(),
    deletedAt: project.deletedAt?.toISOString() ?? null,
    company: project.company,
    _count: project._count,
  };
}
