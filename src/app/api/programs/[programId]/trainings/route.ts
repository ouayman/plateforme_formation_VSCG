import { NextResponse } from "next/server";
import { requireProjectAccessApi, requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { trainingSchema } from "@/lib/validations/program";
import { ensureCertificatesForTraining } from "@/lib/certificates";

async function getProjectId(programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { projectId: true },
  });
  return program?.projectId;
}

export async function GET(
  _req: Request,
  { params }: { params: { programId: string } }
) {
  const projectId = await getProjectId(params.programId);
  if (!projectId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const access = await requireProjectAccessApi(projectId);
  if (access.error) return access.error;

  const trainings = await prisma.training.findMany({
    where: { programId: params.programId },
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { sessions: true } } },
  });

  return NextResponse.json(trainings);
}

export async function POST(
  req: Request,
  { params }: { params: { programId: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const projectId = await getProjectId(params.programId);
  if (!projectId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const access = await requireProjectAccessApi(projectId);
  if (access.error) return access.error;

  const body = await req.json();
  const parsed = trainingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const training = await prisma.training.create({
    data: {
      programId: params.programId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      orderIndex: parsed.data.orderIndex ?? 0,
    },
    include: { _count: { select: { sessions: true } } },
  });

  await ensureCertificatesForTraining(training.id);

  return NextResponse.json(training, { status: 201 });
}
