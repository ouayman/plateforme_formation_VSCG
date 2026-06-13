import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { invalidateTrainersListCache } from "@/lib/cache/trainers-list";
import { setUserSkillDomains } from "@/lib/skill-domain";
import { updateTrainerSchema } from "@/lib/validations/trainer";

async function getTrainer(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      globalRoles: { some: { role: GlobalRole.TRAINER } },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      skillDomains: {
        select: {
          skillDomain: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const trainer = await getTrainer(params.id);
  if (!trainer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateTrainerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (parsed.data.email && parsed.data.email.toLowerCase() !== trainer.email) {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }
  }

  if (parsed.data.skillDomainIds) {
    const domains = await prisma.skillDomain.findMany({
      where: { id: { in: parsed.data.skillDomainIds } },
      select: { id: true },
    });
    if (domains.length !== parsed.data.skillDomainIds.length) {
      return NextResponse.json({ error: "invalid_domains" }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.email !== undefined && { email: parsed.data.email.toLowerCase() }),
      ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
      ...(parsed.data.lastName !== undefined && { lastName: parsed.data.lastName }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
    },
  });

  if (parsed.data.skillDomainIds) {
    await setUserSkillDomains(params.id, parsed.data.skillDomainIds);
  }

  const updated = await getTrainer(params.id);
  invalidateTrainersListCache();
  return NextResponse.json({
    id: updated!.id,
    email: updated!.email,
    firstName: updated!.firstName,
    lastName: updated!.lastName,
    phone: updated!.phone,
    skillDomains: updated!.skillDomains.map((sd) => sd.skillDomain),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const trainer = await getTrainer(params.id);
  if (!trainer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const otherRoles = await prisma.userGlobalRole.count({
    where: { userId: params.id, role: { not: GlobalRole.TRAINER } },
  });

  if (otherRoles > 0) {
    await prisma.$transaction([
      prisma.userGlobalRole.deleteMany({
        where: { userId: params.id, role: GlobalRole.TRAINER },
      }),
      prisma.userSkillDomain.deleteMany({ where: { userId: params.id } }),
    ]);
  } else {
    await prisma.user.delete({ where: { id: params.id } });
  }

  invalidateTrainersListCache();
  return NextResponse.json({ ok: true });
}
