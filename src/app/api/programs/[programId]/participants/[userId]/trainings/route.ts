import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canManageProgramParticipants } from "@/lib/permissions";
import { assignParticipantToTraining } from "@/lib/training-assignment";
import { assignTrainingSchema } from "@/lib/validations/participant";

async function getProgramContext(programId: string) {
  return prisma.program.findUnique({
    where: { id: programId },
    select: { projectId: true, project: { select: { companyId: true } } },
  });
}

export async function POST(
  req: Request,
  { params }: { params: { programId: string; userId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getProgramContext(params.programId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageProgramParticipants(user.id, ctx.projectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const enrolled = await prisma.userProgram.findUnique({
    where: {
      userId_programId: { userId: params.userId, programId: params.programId },
    },
  });
  if (!enrolled) {
    return NextResponse.json({ error: "not_in_program" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = assignTrainingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const training = await prisma.training.findFirst({
    where: { id: parsed.data.trainingId, programId: params.programId },
    select: { id: true },
  });
  if (!training) {
    return NextResponse.json({ error: "training_not_found" }, { status: 404 });
  }

  await assignParticipantToTraining(
    params.userId,
    training.id,
    ctx.project.companyId
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { programId: string; userId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getProgramContext(params.programId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageProgramParticipants(user.id, ctx.projectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const trainingId = new URL(req.url).searchParams.get("trainingId");
  if (!trainingId) {
    return NextResponse.json({ error: "training_id_required" }, { status: 400 });
  }

  const training = await prisma.training.findFirst({
    where: { id: trainingId, programId: params.programId },
    select: { id: true },
  });
  if (!training) {
    return NextResponse.json({ error: "training_not_found" }, { status: 404 });
  }

  const { unassignParticipantFromTraining } = await import("@/lib/training-assignment");
  await unassignParticipantFromTraining(params.userId, training.id);

  return NextResponse.json({ ok: true });
}
