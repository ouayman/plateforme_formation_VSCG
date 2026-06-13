import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { canManageAttendance } from "@/lib/permissions";
import { attendanceUpdateSchema } from "@/lib/validations/participant";

const sessionParticipantSelect = {
  id: true,
  sessionId: true,
  userId: true,
  attendanceStatus: true,
  user: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
} as const;

async function getSessionContext(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    select: {
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

  const participants = await prisma.sessionParticipant.findMany({
    where: { sessionId: params.sessionId },
    select: sessionParticipantSelect,
    orderBy: { user: { lastName: "asc" } },
  });

  return NextResponse.json(participants);
}

export async function PATCH(
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

  const body = await req.json();
  const parsed = attendanceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const previous = await prisma.sessionParticipant.findMany({
    where: { sessionId: params.sessionId },
    select: { userId: true, attendanceStatus: true },
  });

  await prisma.$transaction(
    parsed.data.attendances.map(({ userId, attendanceStatus }) =>
      prisma.sessionParticipant.update({
        where: {
          sessionId_userId: { sessionId: params.sessionId, userId },
        },
        data: { attendanceStatus },
      })
    )
  );

  const { syncSessionStatusInDb } = await import("@/lib/session-status");
  await syncSessionStatusInDb(params.sessionId);

  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    select: { trainingId: true },
  });
  if (session) {
    const { maybeAutoUnlockCertificatesForTraining } = await import(
      "@/lib/certificate-auto-unlock"
    );
    await maybeAutoUnlockCertificatesForTraining(session.trainingId);
  }

  const { handleAttendanceSystemPosts } = await import("@/lib/training-system-posts");
  await handleAttendanceSystemPosts(params.sessionId, parsed.data.attendances, previous);

  const participants = await prisma.sessionParticipant.findMany({
    where: { sessionId: params.sessionId },
    select: sessionParticipantSelect,
    orderBy: { user: { lastName: "asc" } },
  });

  return NextResponse.json(participants);
}
