import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { skillDomainSchema } from "@/lib/validations/skill-domain";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const domains = await prisma.skillDomain.findMany({
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { trainers: true, trainings: true } } },
  });

  return NextResponse.json(domains);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = skillDomainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const existing = await prisma.skillDomain.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return NextResponse.json({ error: "duplicate" }, { status: 409 });
  }

  const maxOrder = await prisma.skillDomain.aggregate({ _max: { orderIndex: true } });

  const domain = await prisma.skillDomain.create({
    data: {
      name: parsed.data.name,
      orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
    },
  });

  return NextResponse.json(domain, { status: 201 });
}
