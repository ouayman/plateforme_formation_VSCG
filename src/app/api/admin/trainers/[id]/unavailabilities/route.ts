import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { unavailabilityInputSchema } from "@/lib/validations/unavailability";

function serialize(row: {
  id: string;
  userId: string;
  startDatetime: Date;
  endDatetime: Date;
  createdById: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    userId: row.userId,
    startDatetime: row.startDatetime.toISOString(),
    endDatetime: row.endDatetime.toISOString(),
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();
  const rows = await prisma.trainerUnavailability.findMany({
    where: { userId: params.id },
    orderBy: { startDatetime: "asc" },
  });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin();
  const body = await req.json();
  const parsed = unavailabilityInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const trainer = await prisma.user.findFirst({
    where: { id: params.id, globalRoles: { some: { role: "TRAINER" } } },
    select: { id: true },
  });
  if (!trainer) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const row = await prisma.trainerUnavailability.create({
    data: {
      userId: params.id,
      startDatetime: new Date(parsed.data.startDatetime),
      endDatetime: new Date(parsed.data.endDatetime),
      createdById: user.id,
    },
  });

  return NextResponse.json(serialize(row), { status: 201 });
}
