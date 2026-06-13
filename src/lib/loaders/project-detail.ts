import "server-only";

import { cache } from "react";
import { ProjectRole, UserType } from "@prisma/client";
import { getCachedClientCompanies } from "@/lib/cache/client-companies";
import { prisma } from "@/lib/prisma";

export const projectDetailSelect = {
  id: true,
  name: true,
  companyId: true,
  startDate: true,
  endDate: true,
  deletedAt: true,
  company: { select: { id: true, name: true } },
  programs: {
    orderBy: { orderIndex: "asc" as const },
    select: {
      id: true,
      name: true,
      orderIndex: true,
      _count: { select: { trainings: true, participants: true } },
    },
  },
  locations: {
    orderBy: { name: "asc" as const },
    select: { id: true, name: true, address: true, instructions: true },
  },
  signatories: {
    orderBy: { name: "asc" as const },
    select: { id: true, name: true, title: true, signatureImageUrl: true },
  },
  projectRoles: {
    where: { role: ProjectRole.COORDINATOR },
    select: {
      id: true,
      userId: true,
      canAddParticipants: true,
      canPublishFeed: true,
      canUnlockCertificates: true,
      canManageSessions: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, type: true },
      },
    },
    orderBy: { user: { lastName: "asc" as const } },
  },
} as const;

export const loadProjectDetail = cache(async (projectId: string) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: projectDetailSelect,
  });
});

export async function loadProjectEditorData(
  companyId: string,
  canEdit: boolean,
  isDeleted: boolean
) {
  if (!canEdit || isDeleted) {
    return { coordinatorUsers: [], clientCompanies: [] as { id: string; name: string }[] };
  }

  const [coordinatorUsers, clientCompanies] = await Promise.all([
    prisma.user.findMany({
      where: { type: UserType.client, companyId },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { lastName: "asc" },
    }),
    getCachedClientCompanies(),
  ]);

  return { coordinatorUsers, clientCompanies };
}
