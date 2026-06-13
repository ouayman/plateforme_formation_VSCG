import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const loadAccountPageData = cache(async (userId: string) => {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      type: true,
      company: { select: { name: true } },
      globalRoles: { select: { role: true } },
      projectRoles: { select: { role: true, projectId: true } },
    },
  });
});
