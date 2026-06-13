import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { canViewAllFeedbacks } from "@/lib/permissions";

async function getProgramContext(programId: string) {
  return prisma.program.findUnique({
    where: { id: programId },
    select: { projectId: true },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { programId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getProgramContext(params.programId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const access = await requireProjectAccessApi(ctx.projectId);
  if (access.error) return access.error;

  if (!(await canViewAllFeedbacks(user.id, ctx.projectId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const feedbacks = await prisma.feedback.findMany({
    where: { training: { programId: params.programId } },
    select: {
      id: true,
      trainingId: true,
      userId: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      training: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(feedbacks);
}
