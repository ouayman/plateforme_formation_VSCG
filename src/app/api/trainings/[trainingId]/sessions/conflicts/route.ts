import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { findTrainerScheduleConflicts } from "@/lib/session-conflicts";

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  trainerIds: z.array(z.string()).default([]),
  excludeSessionId: z.string().optional(),
});

async function getTrainingContext(trainingId: string) {
  return prisma.training.findUnique({
    where: { id: trainingId },
    select: { program: { select: { projectId: true } } },
  });
}

export async function POST(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  await requireAuth();
  const ctx = await getTrainingContext(params.trainingId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const access = await requireProjectAccessApi(ctx.program.projectId);
  if (access.error) return access.error;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const startDatetime = new Date(`${parsed.data.date}T${parsed.data.startTime}:00`);
  const endDatetime = new Date(`${parsed.data.date}T${parsed.data.endTime}:00`);
  if (endDatetime <= startDatetime) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  const trainerIds =
    parsed.data.trainerIds.length > 0
      ? parsed.data.trainerIds
      : (
          await prisma.user.findMany({
            where: { globalRoles: { some: { role: "TRAINER" } } },
            select: { id: true },
          })
        ).map((u) => u.id);

  const conflicts = await findTrainerScheduleConflicts(
    trainerIds,
    startDatetime,
    endDatetime,
    parsed.data.excludeSessionId
  );

  return NextResponse.json({ conflicts });
}
