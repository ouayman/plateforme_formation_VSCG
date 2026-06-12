import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { skillDomainTrainersSchema } from "@/lib/validations/skill-domain";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const domain = await prisma.skillDomain.findUnique({ where: { id: params.id } });
  if (!domain) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = skillDomainTrainersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (parsed.data.trainerIds.length > 0) {
    const trainers = await prisma.user.findMany({
      where: {
        id: { in: parsed.data.trainerIds },
        globalRoles: { some: { role: GlobalRole.TRAINER } },
      },
      select: { id: true },
    });
    if (trainers.length !== parsed.data.trainerIds.length) {
      return NextResponse.json({ error: "invalid_trainers" }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.userSkillDomain.deleteMany({ where: { skillDomainId: params.id } }),
    ...(parsed.data.trainerIds.length > 0
      ? [
          prisma.userSkillDomain.createMany({
            data: parsed.data.trainerIds.map((userId) => ({
              userId,
              skillDomainId: params.id,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
