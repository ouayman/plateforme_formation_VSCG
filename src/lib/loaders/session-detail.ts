import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const sessionDetailSelect = {
  id: true,
  startDatetime: true,
  endDatetime: true,
  status: true,
  trainer: { select: { id: true, firstName: true, lastName: true } },
  location: { select: { name: true, address: true } },
  reports: {
    select: {
      content: true,
      createdAt: true,
      trainer: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
  participants: {
    select: {
      attendanceStatus: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { user: { lastName: "asc" as const } },
  },
  training: {
    select: {
      id: true,
      title: true,
      sessions: {
        select: { id: true, status: true, startDatetime: true, endDatetime: true },
      },
      program: {
        select: {
          id: true,
          name: true,
          projectId: true,
          project: { select: { name: true, deletedAt: true, companyId: true } },
        },
      },
    },
  },
} as const;

export const loadSessionDetail = cache(async (sessionId: string) => {
  return prisma.session.findUnique({
    where: { id: sessionId },
    select: sessionDetailSelect,
  });
});
