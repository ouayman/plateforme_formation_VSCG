import "server-only";

import { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function loadAdminTrainersPageData() {
  return Promise.all([
    prisma.user.findMany({
      where: { globalRoles: { some: { role: GlobalRole.TRAINER } } },
      orderBy: { lastName: "asc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        skillDomains: {
          select: {
            skillDomain: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.skillDomain.findMany({
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true },
    }),
  ] as const);
}
