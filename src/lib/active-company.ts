import { cookies } from "next/headers";
import { CompanyType, UserType } from "@prisma/client";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type UserCompanyOption = { id: string; name: string };

export type ClientCompanyUser = {
  id: string;
  type: UserType;
  companyId: string;
  company: { id: string; name: string; type: CompanyType };
  companies: { company: { id: string; name: string; type: CompanyType } }[];
};

const clientCompanySelect = {
  id: true,
  companyId: true,
  type: true,
  company: { select: { id: true, name: true, type: true } },
  companies: {
    include: { company: { select: { id: true, name: true, type: true } } },
  },
} as const;

export function companyOptionsFromClientUser(user: ClientCompanyUser): UserCompanyOption[] {
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

export function resolveActiveCompanyId(
  user: Pick<ClientCompanyUser, "companyId" | "type">,
  options: UserCompanyOption[]
): string | null {
  if (user.type !== UserType.client) return null;
  if (options.length === 0) return user.companyId;

  const cookie = cookies().get(ACTIVE_COMPANY_COOKIE)?.value;
  if (cookie && options.some((o) => o.id === cookie)) return cookie;

  if (options.some((o) => o.id === user.companyId)) return user.companyId;
  return options[0]?.id ?? user.companyId;
}

export function getClientCompanyContext(user: ClientCompanyUser) {
  const companyOptions = companyOptionsFromClientUser(user);
  const activeCompanyId = resolveActiveCompanyId(user, companyOptions);
  return { companyOptions, activeCompanyId };
}

export async function getUserCompanyOptions(userId: string): Promise<UserCompanyOption[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: clientCompanySelect,
  });
  if (!user || user.type !== UserType.client) return [];
  return companyOptionsFromClientUser(user);
}

export async function getActiveCompanyId(
  userId: string,
  clientUser?: ClientCompanyUser | null
): Promise<string | null> {
  if (clientUser?.id === userId && clientUser.type === UserType.client) {
    return resolveActiveCompanyId(
      clientUser,
      companyOptionsFromClientUser(clientUser)
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: clientCompanySelect,
  });
  if (!user || user.type !== UserType.client) return null;

  return resolveActiveCompanyId(user, companyOptionsFromClientUser(user));
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
