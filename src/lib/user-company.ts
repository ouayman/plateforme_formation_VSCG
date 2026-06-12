import { prisma } from "@/lib/prisma";

export async function ensureUserCompanyAffiliation(userId: string, companyId: string) {
  return prisma.userCompany.upsert({
    where: { userId_companyId: { userId, companyId } },
    create: { userId, companyId },
    update: {},
  });
}

export async function getUserCompanyIds(userId: string) {
  const rows = await prisma.userCompany.findMany({
    where: { userId },
    select: { companyId: true },
  });
  return rows.map((r) => r.companyId);
}

export async function userBelongsToCompany(userId: string, companyId: string) {
  const row = await prisma.userCompany.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { id: true },
  });
  return !!row;
}
