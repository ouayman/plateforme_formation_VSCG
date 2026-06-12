import { NextResponse } from "next/server";
import { requireProjectAccessApi, requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validations/program";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const access = await requireProjectAccessApi(params.id);
  if (access.error) return access.error;

  const programs = await prisma.program.findMany({
    where: { projectId: params.id },
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { trainings: true, participants: true } } },
  });

  return NextResponse.json(programs);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const access = await requireProjectAccessApi(params.id);
  if (access.error) return access.error;

  const body = await req.json();
  const parsed = programSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const program = await prisma.program.create({
    data: { projectId: params.id, ...parsed.data },
    include: { _count: { select: { trainings: true, participants: true } } },
  });

  return NextResponse.json(program, { status: 201 });
}
