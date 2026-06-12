import { NextResponse } from "next/server";
import { requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { trainingSchema } from "@/lib/validations/program";

async function getProjectId(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { projectId: true },
  });
  return program?.projectId;
}

export async function PATCH(
  req: Request,
  { params }: { params: { programId: string; trainingId: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const projectId = await getProjectId(params.programId);
  if (!projectId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = trainingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const data = parsed.data;
  const training = await prisma.training.update({
    where: { id: params.trainingId, programId: params.programId },
    data: {
      title: data.title,
      description: data.description || null,
      ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
    },
    include: { _count: { select: { sessions: true } } },
  });

  return NextResponse.json(training);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { programId: string; trainingId: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  await prisma.training.delete({
    where: { id: params.trainingId, programId: params.programId },
  });

  return NextResponse.json({ ok: true });
}
