import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { canManageProgramParticipants } from "@/lib/permissions";
import {
  assignParticipantToTrainings,
  ensureProgramEnrollment,
} from "@/lib/training-assignment";
import {
  canEditParticipantIdentity,
  lookupParticipantByEmail,
} from "@/lib/participant-lookup";
import { ensureUserCompanyAffiliation } from "@/lib/user-company";
import { addProgramParticipantSchema } from "@/lib/validations/participant";

async function getProgramContext(programId: string) {
  return prisma.program.findUnique({
    where: { id: programId },
    select: { projectId: true, project: { select: { companyId: true } } },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { programId: string } }
) {
  const ctx = await getProgramContext(params.programId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const access = await requireProjectAccessApi(ctx.projectId);
  if (access.error) return access.error;

  const participants = await prisma.userProgram.findMany({
    where: { programId: params.programId },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: { select: { name: true } },
          trainings: {
            where: { deletedAt: null, training: { programId: params.programId } },
            select: {
              trainingId: true,
              training: { select: { id: true, title: true, orderIndex: true } },
            },
          },
        },
      },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  return NextResponse.json(
    participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      user: {
        id: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        email: p.user.email,
        companyName: p.user.company.name,
      },
      trainings: p.user.trainings
        .map((t) => t.training)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: { programId: string } }
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

  const body = await req.json();
  const parsed = addProgramParticipantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const validTrainings = await prisma.training.findMany({
    where: { programId: params.programId, id: { in: parsed.data.trainingIds } },
    select: { id: true },
  });
  if (validTrainings.length !== parsed.data.trainingIds.length) {
    return NextResponse.json({ error: "invalid_training" }, { status: 400 });
  }

  const lookup = await lookupParticipantByEmail(user.id, params.programId, parsed.data.email);
  let participantUserId: string;

  if (lookup.found) {
    participantUserId = lookup.userId;

    if (
      await canEditParticipantIdentity(user.id, participantUserId, ctx.project.companyId)
    ) {
      await prisma.user.update({
        where: { id: participantUserId },
        data: {
          firstName: parsed.data.firstName.trim(),
          lastName: parsed.data.lastName.trim(),
        },
      });
    }
  } else {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.trim().toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "email_unavailable" }, { status: 409 });
    }

    const created = await prisma.user.create({
      data: {
        email: parsed.data.email.trim().toLowerCase(),
        firstName: parsed.data.firstName.trim(),
        lastName: parsed.data.lastName.trim(),
        companyId: ctx.project.companyId,
        type: UserType.client,
      },
    });
    participantUserId = created.id;
  }

  await ensureUserCompanyAffiliation(participantUserId, ctx.project.companyId);
  await ensureProgramEnrollment(participantUserId, params.programId);

  if (parsed.data.trainingIds.length > 0) {
    await assignParticipantToTrainings(
      participantUserId,
      parsed.data.trainingIds,
      ctx.project.companyId
    );
  }

  const participant = await prisma.userProgram.findUnique({
    where: {
      userId_programId: { userId: participantUserId, programId: params.programId },
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: { select: { name: true } },
          trainings: {
            where: { deletedAt: null, training: { programId: params.programId } },
            select: {
              training: { select: { id: true, title: true, orderIndex: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(
    {
      id: participant!.id,
      userId: participantUserId,
      user: {
        id: participant!.user.id,
        firstName: participant!.user.firstName,
        lastName: participant!.user.lastName,
        email: participant!.user.email,
        companyName: participant!.user.company.name,
      },
      trainings: participant!.user.trainings
        .map((t) => t.training)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    },
    { status: 201 }
  );
}
