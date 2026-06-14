import { NextResponse } from "next/server";
import { CompanyType, UserType } from "@prisma/client";
import { requireAdminApi, requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/mail/send-welcome";
import { inviteUserSchema } from "@/lib/validations/user";

export async function GET() {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      type: true,
      companyId: true,
      createdAt: true,
      company: { select: { id: true, name: true, type: true } },
      globalRoles: { select: { role: true } },
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = inviteUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { email, firstName, lastName, companyId, type, globalRoles } = parsed.data;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: "company_not_found" }, { status: 404 });
  }

  const typeMismatch =
    (type === "internal" && company.type !== CompanyType.internal) ||
    (type === "client" && company.type !== CompanyType.client);

  if (typeMismatch) {
    return NextResponse.json({ error: "type_mismatch" }, { status: 400 });
  }

  if (type === "client" && globalRoles.length > 0) {
    return NextResponse.json({ error: "client_no_global_roles" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "email_exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      firstName,
      lastName,
      companyId,
      type: type as UserType,
      ...(globalRoles.length > 0 && {
        globalRoles: {
          create: globalRoles.map((role) => ({ role })),
        },
      }),
    },
    include: {
      company: { select: { id: true, name: true, type: true } },
      globalRoles: { select: { role: true } },
    },
  });

  if (type === "client") {
    const { ensureUserCompanyAffiliation } = await import("@/lib/user-company");
    await ensureUserCompanyAffiliation(user.id, companyId);
  }

  try {
    await sendWelcomeEmail(user.email, user.firstName, req);
  } catch (err) {
    console.error("[Welcome] Failed to send email:", err);
  }

  return NextResponse.json(user, { status: 201 });
}
