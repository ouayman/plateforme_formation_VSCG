import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { unavailabilityInputSchema } from "@/lib/validations/unavailability";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; blockId: string } }
) {
  await requireAdmin();
  const body = await req.json();
  const parsed = unavailabilityInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const existing = await prisma.trainerUnavailability.findFirst({
    where: { id: params.blockId, userId: params.id },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const row = await prisma.trainerUnavailability.update({
    where: { id: params.blockId },
    data: {
      startDatetime: new Date(parsed.data.startDatetime),
      endDatetime: new Date(parsed.data.endDatetime),
    },
  });

  return NextResponse.json({
    id: row.id,
    userId: row.userId,
    startDatetime: row.startDatetime.toISOString(),
    endDatetime: row.endDatetime.toISOString(),
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; blockId: string } }
) {
  await requireAdmin();
  const existing = await prisma.trainerUnavailability.findFirst({
    where: { id: params.blockId, userId: params.id },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.trainerUnavailability.delete({ where: { id: params.blockId } });
  return NextResponse.json({ ok: true });
}
