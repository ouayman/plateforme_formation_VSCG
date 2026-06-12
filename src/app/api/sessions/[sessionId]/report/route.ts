import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { canManageAttendance } from "@/lib/permissions";
import { syncSessionStatusInDb } from "@/lib/session-status";
import { reportSchema } from "@/lib/validations/session";

async function getSessionContext(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      trainerId: true,
      training: { select: { program: { select: { projectId: true } } } },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const ctx = await getSessionContext(params.sessionId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const access = await requireProjectAccessApi(ctx.training.program.projectId);
  if (access.error) return access.error;

  const report = await prisma.report.findFirst({
    where: { sessionId: params.sessionId },
    include: {
      trainer: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(report);
}

export async function PUT(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await canManageAttendance(user.id, params.sessionId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ctx = await getSessionContext(params.sessionId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const trainerId = ctx.trainerId ?? user.id;
  const existing = await prisma.report.findFirst({
    where: { sessionId: params.sessionId },
    orderBy: { createdAt: "desc" },
  });

  const report = existing
    ? await prisma.report.update({
        where: { id: existing.id },
        data: { content: parsed.data.content, trainerId },
        include: {
          trainer: { select: { firstName: true, lastName: true } },
        },
      })
    : await prisma.report.create({
        data: {
          sessionId: params.sessionId,
          trainerId,
          content: parsed.data.content,
        },
        include: {
          trainer: { select: { firstName: true, lastName: true } },
        },
      });

  await syncSessionStatusInDb(params.sessionId);

  return NextResponse.json(report);
}
