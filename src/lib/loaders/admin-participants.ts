import "server-only";

import { UserType } from "@prisma/client";
import { getCachedClientCompanies } from "@/lib/cache/client-companies";
import { prisma } from "@/lib/prisma";

export async function loadAdminParticipantsPageData() {
  const [participants, clientCompanies] = await Promise.all([
    prisma.user.findMany({
      where: {
        type: UserType.client,
        globalRoles: { none: {} },
        projectRoles: { none: {} },
      },
      orderBy: { lastName: "asc" },
      take: 500,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        companyId: true,
        loginCount: true,
        company: { select: { id: true, name: true } },
      },
    }),
    getCachedClientCompanies(),
  ]);

  return { participants, clientCompanies };
}
