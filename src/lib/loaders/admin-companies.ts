import "server-only";

import { CompanyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function loadAdminCompaniesPageData() {
  return prisma.company.findMany({
    where: { type: CompanyType.client },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      _count: { select: { users: true, projects: true } },
    },
  });
}
