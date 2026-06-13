import "server-only";

import { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function loadAdminSkillDomainsPageData() {
  return Promise.all([
    prisma.skillDomain.findMany({
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        name: true,
        trainers: { select: { userId: true } },
        _count: { select: { trainings: true } },
      },
    }),
    prisma.user.findMany({
      where: { globalRoles: { some: { role: GlobalRole.TRAINER } } },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
  ] as const);
}
