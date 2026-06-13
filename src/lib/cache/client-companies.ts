import "server-only";

import { CompanyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CachedClientCompany = { id: string; name: string };

const TTL_MS = 60_000;

let cache: { value: CachedClientCompany[]; expiresAt: number } | null = null;

export async function getCachedClientCompanies(): Promise<CachedClientCompany[]> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  const value = await prisma.company.findMany({
    where: { type: CompanyType.client },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  cache = { value, expiresAt: now + TTL_MS };
  return value;
}

export function invalidateClientCompaniesCache() {
  cache = null;
}
