import "server-only";

import { SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TrainerConflictInfo } from "@/lib/session-conflicts-types";

export type { TrainerConflictKind, TrainerConflictInfo } from "@/lib/session-conflicts-types";
export { conflictLabel } from "@/lib/session-conflicts-types";

export async function findTrainerScheduleConflicts(
  trainerIds: string[],
  startDatetime: Date,
  endDatetime: Date,
  excludeSessionId?: string
): Promise<Record<string, TrainerConflictInfo[]>> {
  if (trainerIds.length === 0) return {};

  const [sessions, unavailabilities] = await Promise.all([
    prisma.session.findMany({
      where: {
        ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
        status: { not: SessionStatus.cancelled },
        startDatetime: { lt: endDatetime },
        endDatetime: { gt: startDatetime },
        OR: [
          { trainerId: { in: trainerIds } },
          { trainers: { some: { userId: { in: trainerIds } } } },
        ],
      },
      include: {
        location: { select: { name: true } },
        trainers: { select: { userId: true } },
        training: {
          select: {
            title: true,
            program: {
              select: {
                name: true,
                project: {
                  select: {
                    name: true,
                    company: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDatetime: "asc" },
    }),
    prisma.trainerUnavailability.findMany({
      where: {
        userId: { in: trainerIds },
        startDatetime: { lt: endDatetime },
        endDatetime: { gt: startDatetime },
      },
      orderBy: { startDatetime: "asc" },
    }),
  ]);

  const result: Record<string, TrainerConflictInfo[]> = {};

  for (const session of sessions) {
    const assignedIds = new Set<string>();
    if (session.trainerId) assignedIds.add(session.trainerId);
    for (const link of session.trainers) assignedIds.add(link.userId);

    const info: TrainerConflictInfo = {
      kind: "session",
      id: session.id,
      startDatetime: session.startDatetime.toISOString(),
      endDatetime: session.endDatetime.toISOString(),
      locationName: session.location?.name ?? null,
      companyName: session.training.program.project.company.name,
      projectName: session.training.program.project.name,
      programName: session.training.program.name,
      trainingTitle: session.training.title,
    };

    for (const trainerId of trainerIds) {
      if (!assignedIds.has(trainerId)) continue;
      if (!result[trainerId]) result[trainerId] = [];
      result[trainerId].push(info);
    }
  }

  for (const block of unavailabilities) {
    const info: TrainerConflictInfo = {
      kind: "unavailability",
      id: block.id,
      startDatetime: block.startDatetime.toISOString(),
      endDatetime: block.endDatetime.toISOString(),
    };
    if (!result[block.userId]) result[block.userId] = [];
    result[block.userId].push(info);
  }

  return result;
}
