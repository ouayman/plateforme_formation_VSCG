import "server-only";

import { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CachedTrainer = {
  id: string;
  firstName: string;
  lastName: string;
};

const TTL_MS = 60_000;

let cache: { value: CachedTrainer[]; expiresAt: number } | null = null;

export async function getCachedTrainersList(): Promise<CachedTrainer[]> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  const value = await prisma.user.findMany({
    where: { globalRoles: { some: { role: GlobalRole.TRAINER } } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });

  cache = { value, expiresAt: now + TTL_MS };
  return value;
}

export function invalidateTrainersListCache() {
  cache = null;
}
