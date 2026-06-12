import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  trainingIds: z.array(z.string().min(1)).min(1),
});

export async function PUT(
  req: Request,
  { params }: { params: { programId: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const program = await prisma.program.findUnique({
    where: { id: params.programId },
    select: {
      trainings: { select: { id: true } },
    },
  });
  if (!program) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existingIds = new Set(program.trainings.map((t) => t.id));
  if (
    parsed.data.trainingIds.length !== existingIds.size ||
    parsed.data.trainingIds.some((id) => !existingIds.has(id))
  ) {
    return NextResponse.json({ error: "invalid_order" }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.trainingIds.map((id, index) =>
      prisma.training.update({
        where: { id, programId: params.programId },
        data: { orderIndex: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
