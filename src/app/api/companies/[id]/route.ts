import { NextResponse } from "next/server";
import { CompanyType } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { updateCompanySchema } from "@/lib/validations/company";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = updateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { _count: { select: { users: true } } },
  });

  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (parsed.data.type && parsed.data.type !== company.type && company._count.users > 0) {
    return NextResponse.json({ error: "type_change_has_users" }, { status: 400 });
  }

  if (company.type === CompanyType.internal && parsed.data.type === CompanyType.client) {
    return NextResponse.json({ error: "cannot_change_internal_type" }, { status: 400 });
  }

  const updated = await prisma.company.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.type !== undefined && { type: parsed.data.type }),
      ...(parsed.data.logoUrl !== undefined && {
        logoUrl: parsed.data.logoUrl || null,
      }),
      ...(parsed.data.attendanceThresholdPercent !== undefined && {
        attendanceThresholdPercent: parsed.data.attendanceThresholdPercent,
        attendanceThresholdUpdatedAt: new Date(),
      }),
    },
    include: { _count: { select: { users: true, projects: true } } },
  });

  if (parsed.data.attendanceThresholdPercent !== undefined) {
    const { reevaluateAutoUnlockForCompany } = await import("@/lib/certificate-auto-unlock");
    await reevaluateAutoUnlockForCompany(params.id);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { _count: { select: { users: true, projects: true } } },
  });

  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (company.type === CompanyType.internal) {
    return NextResponse.json({ error: "cannot_delete_internal" }, { status: 400 });
  }

  if (company._count.users > 0 || company._count.projects > 0) {
    return NextResponse.json({ error: "has_dependencies" }, { status: 409 });
  }

  await prisma.company.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
