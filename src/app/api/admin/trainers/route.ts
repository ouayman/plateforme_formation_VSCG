import { NextResponse } from "next/server";
import { GlobalRole, UserType } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { invalidateTrainersListCache } from "@/lib/cache/trainers-list";
import { getInternalCompany } from "@/lib/platform-settings";
import { sendWelcomeEmail } from "@/lib/mail/send-welcome";
import { setUserSkillDomains } from "@/lib/skill-domain";
import { createTrainerSchema } from "@/lib/validations/trainer";

const trainerSelect = {
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
} as const;

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const trainers = await prisma.user.findMany({
    where: { globalRoles: { some: { role: GlobalRole.TRAINER } } },
    orderBy: { lastName: "asc" },
    select: trainerSelect,
  });

  return NextResponse.json(
    trainers.map((t) => ({
      id: t.id,
      email: t.email,
      firstName: t.firstName,
      lastName: t.lastName,
      phone: t.phone,
      skillDomains: t.skillDomains.map((sd) => sd.skillDomain),
    }))
  );
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = createTrainerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const internalCompany = await getInternalCompany();
  if (!internalCompany) {
    return NextResponse.json({ error: "internal_company_missing" }, { status: 500 });
  }

  const domains = await prisma.skillDomain.findMany({
    where: { id: { in: parsed.data.skillDomainIds } },
    select: { id: true },
  });
  if (domains.length !== parsed.data.skillDomainIds.length) {
    return NextResponse.json({ error: "invalid_domains" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "email_exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      companyId: internalCompany.id,
      type: UserType.internal,
      globalRoles: { create: [{ role: GlobalRole.TRAINER }] },
    },
  });

  await setUserSkillDomains(user.id, parsed.data.skillDomainIds);
  invalidateTrainersListCache();

  try {
    await sendWelcomeEmail(user.email, user.firstName, req);
  } catch (err) {
    console.error("[Welcome] Failed to send email:", err);
  }

  const trainer = await prisma.user.findUnique({
    where: { id: user.id },
    select: trainerSelect,
  });

  return NextResponse.json(
    {
      id: trainer!.id,
      email: trainer!.email,
      firstName: trainer!.firstName,
      lastName: trainer!.lastName,
      phone: trainer!.phone,
      skillDomains: trainer!.skillDomains.map((sd) => sd.skillDomain),
    },
    { status: 201 }
  );
}
