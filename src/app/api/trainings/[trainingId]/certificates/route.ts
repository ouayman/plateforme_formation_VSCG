import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  canAccessTrainingAsParticipant,
  canManageProjects,
  canViewAllFeedbacks,
  isProgramParticipant,
} from "@/lib/permissions";

async function getTrainingContext(trainingId: string) {
  return prisma.training.findUnique({
    where: { id: trainingId },
    select: { programId: true, program: { select: { projectId: true } } },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ctx = await getTrainingContext(params.trainingId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const canViewAll = await canViewAllFeedbacks(user.id, ctx.program.projectId);
  const isParticipant = await isProgramParticipant(user.id, ctx.programId);
  const canAccess = await canAccessTrainingAsParticipant(user.id, params.trainingId);
  if (!canAccess && !(await canManageProjects(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const where =
    canViewAll
      ? { trainingId: params.trainingId }
      : { trainingId: params.trainingId, userId: user.id };

  const certificates = await prisma.certificate.findMany({
    where,
    select: {
      id: true,
      userId: true,
      trainingId: true,
      status: true,
      unlockedBy: true,
      unlockedAt: true,
      generatedAt: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      unlockedByUser: { select: { firstName: true, lastName: true } },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  return NextResponse.json({ certificates, isParticipant });
}
