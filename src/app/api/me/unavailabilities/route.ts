import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require";
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

export async function GET() {
  const user = await requireAuth();
  const rows = await prisma.trainerUnavailability.findMany({
    where: { userId: user.id },
    orderBy: { startDatetime: "asc" },
  });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user.permissions.isTrainer) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = unavailabilityInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const row = await prisma.trainerUnavailability.create({
    data: {
      userId: user.id,
      startDatetime: new Date(parsed.data.startDatetime),
      endDatetime: new Date(parsed.data.endDatetime),
      createdById: user.id,
    },
  });

  return NextResponse.json(serialize(row), { status: 201 });
}
