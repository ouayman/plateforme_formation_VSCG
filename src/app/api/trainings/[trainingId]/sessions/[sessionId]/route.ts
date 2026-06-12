import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { canManageTrainingSessions } from "@/lib/permissions";
import { sessionInclude, syncSessionTrainers } from "@/lib/session-trainers";
import { sessionSchema } from "@/lib/validations/program";

export async function PATCH(
  req: Request,
  { params }: { params: { trainingId: string; sessionId: string } }
) {
  const user = await requireAuth();

  const existing = await prisma.session.findUnique({
    where: { id: params.sessionId, trainingId: params.trainingId },
    select: { training: { select: { program: { select: { projectId: true } } } } },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageTrainingSessions(
    user.id,
    existing.training.program.projectId
  );
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const session = await prisma.session.update({
    where: { id: params.sessionId, trainingId: params.trainingId },
    data: {
      trainerId: parsed.data.trainerIds[0] ?? null,
      locationId: parsed.data.locationId || null,
      startDatetime: new Date(parsed.data.startDatetime),
      endDatetime: new Date(parsed.data.endDatetime),
      status: parsed.data.status,
    },
    include: sessionInclude,
  });

  await syncSessionTrainers(session.id, parsed.data.trainerIds);

  const updated = await prisma.session.findUnique({
    where: { id: session.id },
    include: sessionInclude,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { trainingId: string; sessionId: string } }
) {
  const user = await requireAuth();

  const existing = await prisma.session.findUnique({
    where: { id: params.sessionId, trainingId: params.trainingId },
    select: { training: { select: { program: { select: { projectId: true } } } } },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageTrainingSessions(
    user.id,
    existing.training.program.projectId
  );
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.session.delete({
    where: { id: params.sessionId, trainingId: params.trainingId },
  });

  return NextResponse.json({ ok: true });
}
