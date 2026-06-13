import "server-only";

import { CompanyType, UserType } from "@prisma/client";
import { getCachedClientCompanies } from "@/lib/cache/client-companies";
import { getCachedPlatformSettings } from "@/lib/cache/platform-settings-cache";
import { prisma } from "@/lib/prisma";

export async function loadAdminUsersPageData() {
  const [users, clientCompanies, settings, internalCompany] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [{ type: UserType.internal }, { type: UserType.client }],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        companyId: true,
        type: true,
        loginCount: true,
        company: { select: { id: true, name: true, type: true, logoUrl: true } },
        globalRoles: { select: { role: true } },
      },
    }),
    getCachedClientCompanies(),
    getCachedPlatformSettings(),
    prisma.company.findFirst({
      where: { type: CompanyType.internal },
      select: { id: true },
    }),
  ]);

  return {
    users,
    clientCompanies: clientCompanies.map((c) => ({ ...c, type: "client" as const })),
    organizationName: settings.organizationName,
    internalCompanyId: internalCompany?.id ?? null,
  };
}
