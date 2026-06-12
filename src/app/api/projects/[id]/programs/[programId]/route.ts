import { NextResponse } from "next/server";
import { requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { programSchema } from "@/lib/validations/program";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; programId: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = programSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const program = await prisma.program.update({
    where: { id: params.programId, projectId: params.id },
    data: parsed.data,
    include: { _count: { select: { trainings: true, participants: true } } },
  });

  return NextResponse.json(program);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; programId: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  await prisma.program.delete({
    where: { id: params.programId, projectId: params.id },
  });

  return NextResponse.json({ ok: true });
}
