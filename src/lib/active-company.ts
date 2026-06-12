import { cookies } from "next/headers";
import { CompanyType } from "@prisma/client";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type UserCompanyOption = { id: string; name: string };

export async function getUserCompanyOptions(userId: string): Promise<UserCompanyOption[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      companyId: true,
      company: { select: { id: true, name: true, type: true } },
      companies: {
        include: { company: { select: { id: true, name: true, type: true } } },
      },
    },
  });
  if (!user) return [];

  const map = new Map<string, UserCompanyOption>();
  if (user.company.type === CompanyType.client) {
    map.set(user.company.id, { id: user.company.id, name: user.company.name });
  }
  for (const row of user.companies) {
    if (row.company.type === CompanyType.client) {
      map.set(row.company.id, { id: row.company.id, name: row.company.name });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export async function getActiveCompanyId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true, type: true },
  });
  if (!user || user.type !== "client") return null;

  const options = await getUserCompanyOptions(userId);
  if (options.length === 0) return user.companyId;

  const cookie = cookies().get(ACTIVE_COMPANY_COOKIE)?.value;
  if (cookie && options.some((o) => o.id === cookie)) return cookie;

  if (options.some((o) => o.id === user.companyId)) return user.companyId;
  return options[0]?.id ?? user.companyId;
}

export function setActiveCompanyCookie(companyId: string) {
  cookies().set(ACTIVE_COMPANY_COOKIE, companyId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
