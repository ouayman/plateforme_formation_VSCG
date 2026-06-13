import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canManageProgramParticipants } from "@/lib/permissions";
import {
  assignParticipantToTraining,
  unassignParticipantFromTraining,
} from "@/lib/training-assignment";
import { isUserAssignedToTraining } from "@/lib/user-training";

async function getTrainingContext(trainingId: string) {
  return prisma.training.findUnique({
    where: { id: trainingId },
    select: {
      programId: true,
      program: { select: { projectId: true, project: { select: { companyId: true } } } },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getTrainingContext(params.trainingId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageProgramParticipants(user.id, ctx.program.projectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [assigned, programPool] = await Promise.all([
    prisma.userTraining.findMany({
      where: { trainingId: params.trainingId, deletedAt: null },
      select: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { user: { lastName: "asc" } },
    }),
    prisma.userProgram.findMany({
      where: { programId: ctx.programId },
      select: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { user: { lastName: "asc" } },
    }),
  ]);

  const assignedIds = new Set(assigned.map((a) => a.userId));

  return NextResponse.json({
    assigned: assigned.map((row) => row.user),
    available: programPool
      .filter((p) => !assignedIds.has(p.userId))
      .map((p) => p.user),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getTrainingContext(params.trainingId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageProgramParticipants(user.id, ctx.program.projectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const userId = typeof body.userId === "string" ? body.userId : null;
  if (!userId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const inProgram = await prisma.userProgram.findUnique({
    where: {
      userId_programId: { userId, programId: ctx.programId },
    },
  });
  if (!inProgram) {
    return NextResponse.json({ error: "not_in_program" }, { status: 400 });
  }

  if (await isUserAssignedToTraining(userId, params.trainingId)) {
    return NextResponse.json({ ok: true });
  }

  await assignParticipantToTraining(userId, params.trainingId, ctx.program.project.companyId);

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getTrainingContext(params.trainingId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageProgramParticipants(user.id, ctx.program.projectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "user_id_required" }, { status: 400 });
  }

  await unassignParticipantFromTraining(userId, params.trainingId);

  return NextResponse.json({ ok: true });
}
