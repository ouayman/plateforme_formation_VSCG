import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canManageProgramParticipants } from "@/lib/permissions";
import { removeProgramParticipantFromSessions } from "@/lib/session-participants";
import { removeCertificatesForProgramUser } from "@/lib/certificates";

export async function DELETE(
  _req: Request,
  { params }: { params: { programId: string; userId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const program = await prisma.program.findUnique({
    where: { id: params.programId },
    select: { projectId: true },
  });

  if (!program) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageProgramParticipants(user.id, program.projectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await removeProgramParticipantFromSessions(params.programId, params.userId);
  await removeCertificatesForProgramUser(params.userId, params.programId);

  const programTrainings = await prisma.training.findMany({
    where: { programId: params.programId },
    select: { id: true },
  });

  if (programTrainings.length > 0) {
    await prisma.userTraining.updateMany({
      where: {
        userId: params.userId,
        trainingId: { in: programTrainings.map((t) => t.id) },
      },
      data: { deletedAt: new Date() },
    });
  }

  await prisma.userProgram.delete({
    where: {
      userId_programId: { userId: params.userId, programId: params.programId },
    },
  });

  return NextResponse.json({ ok: true });
}
