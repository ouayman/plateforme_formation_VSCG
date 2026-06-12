import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { canManageTrainingSessions } from "@/lib/permissions";
import { syncSessionParticipants } from "@/lib/session-participants";
import { sessionInclude, syncSessionTrainers } from "@/lib/session-trainers";
import { sessionBulkSchema, sessionSchema } from "@/lib/validations/program";

async function getTrainingContext(trainingId: string) {
  return prisma.training.findUnique({
    where: { id: trainingId },
    select: { programId: true, program: { select: { projectId: true } } },
  });
}

async function assertSessionAccess(trainingId: string, userId: string) {
  const ctx = await getTrainingContext(trainingId);
  if (!ctx) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };

  const allowed = await canManageTrainingSessions(userId, ctx.program.projectId);
  if (!allowed) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  return { ctx };
}

export async function GET(
  _req: Request,
  { params }: { params: { trainingId: string } }
) {
  await requireAuth();
  const ctx = await getTrainingContext(params.trainingId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const access = await requireProjectAccessApi(ctx.program.projectId);
  if (access.error) return access.error;

  const sessions = await prisma.session.findMany({
    where: { trainingId: params.trainingId },
    orderBy: { startDatetime: "asc" },
    include: sessionInclude,
  });

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      trainerId: s.trainerId,
      trainerIds:
        s.trainers.length > 0
          ? s.trainers.map((t) => t.userId)
          : s.trainerId
            ? [s.trainerId]
            : [],
      trainers:
        s.trainers.length > 0
          ? s.trainers.map((t) => t.user)
          : s.trainer
            ? [s.trainer]
            : [],
      locationId: s.locationId,
      location: s.location,
      startDatetime: s.startDatetime.toISOString(),
      endDatetime: s.endDatetime.toISOString(),
      status: s.status,
      participantCount: s._count.participants,
    }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await requireAuth();
  const access = await assertSessionAccess(params.trainingId, user.id);
  if (access.error) return access.error;

  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const session = await prisma.session.create({
    data: {
      trainingId: params.trainingId,
      trainerId: parsed.data.trainerIds[0] ?? null,
      locationId: parsed.data.locationId || null,
      startDatetime: new Date(parsed.data.startDatetime),
      endDatetime: new Date(parsed.data.endDatetime),
      status: parsed.data.status,
    },
  });

  await syncSessionTrainers(session.id, parsed.data.trainerIds);
  await syncSessionParticipants(session.id, params.trainingId);

  const updated = await prisma.session.findUnique({
    where: { id: session.id },
    include: sessionInclude,
  });

  return NextResponse.json(updated, { status: 201 });
}

export async function PUT(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await requireAuth();
  const access = await assertSessionAccess(params.trainingId, user.id);
  if (access.error) return access.error;

  const body = await req.json();
  const parsed = sessionBulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const seen = new Set<string>();
  for (let index = 0; index < parsed.data.sessions.length; index++) {
    const row = parsed.data.sessions[index];
    const start = new Date(row.startDatetime);
    const end = new Date(row.endDatetime);
    const key = `${start.toISOString()}|${end.toISOString()}`;

    if (seen.has(key)) {
      return NextResponse.json({ error: "duplicate_slot", index }, { status: 409 });
    }
    seen.add(key);

    const existing = await prisma.session.findFirst({
      where: {
        trainingId: params.trainingId,
        startDatetime: start,
        endDatetime: end,
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "duplicate_slot", index }, { status: 409 });
    }
  }

  const created = [];
  for (const row of parsed.data.sessions) {
    const session = await prisma.session.create({
      data: {
        trainingId: params.trainingId,
        trainerId: row.trainerIds[0] ?? null,
        locationId: row.locationId || null,
        startDatetime: new Date(row.startDatetime),
        endDatetime: new Date(row.endDatetime),
        status: row.status,
      },
    });
    await syncSessionTrainers(session.id, row.trainerIds);
    await syncSessionParticipants(session.id, params.trainingId);
    created.push(session.id);
  }

  const sessions = await prisma.session.findMany({
    where: { id: { in: created } },
    include: sessionInclude,
    orderBy: { startDatetime: "asc" },
  });

  return NextResponse.json(sessions, { status: 201 });
}
