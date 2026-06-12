import { NextResponse } from "next/server";
import { CompanyType } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { updateUserRolesSchema, updateUserSchema } from "@/lib/validations/user";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const rolesOnly =
    Object.keys(body).length === 1 && body.globalRoles !== undefined;

  const parsed = rolesOnly
    ? updateUserRolesSchema.safeParse(body)
    : updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { globalRoles: true },
  });

  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = parsed.data as {
    email?: string;
    firstName?: string;
    lastName?: string;
    companyId?: string;
    type?: "internal" | "client";
    globalRoles?: ("ADMIN" | "PLANNER" | "TRAINER")[];
  };

  const nextType = data.type ?? user.type;
  const nextCompanyId = data.companyId ?? user.companyId;
  const nextRoles = data.globalRoles ?? user.globalRoles.map((r) => r.role);

  const company = await prisma.company.findUnique({ where: { id: nextCompanyId } });
  if (!company) {
    return NextResponse.json({ error: "company_not_found" }, { status: 404 });
  }

  const typeMismatch =
    (nextType === "internal" && company.type !== CompanyType.internal) ||
    (nextType === "client" && company.type !== CompanyType.client);

  if (typeMismatch) {
    return NextResponse.json({ error: "type_mismatch" }, { status: 400 });
  }

  if (nextType === "client" && nextRoles.length > 0) {
    return NextResponse.json({ error: "client_no_global_roles" }, { status: 400 });
  }

  if (params.id === auth.user.id && !nextRoles.includes("ADMIN")) {
    return NextResponse.json({ error: "cannot_remove_own_admin" }, { status: 400 });
  }

  if (data.email && data.email.toLowerCase() !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }
  }

  if (data.globalRoles || rolesOnly) {
    await prisma.$transaction([
      prisma.userGlobalRole.deleteMany({ where: { userId: params.id } }),
      ...nextRoles.map((role) =>
        prisma.userGlobalRole.create({
          data: { userId: params.id, role },
        })
      ),
    ]);
  }

  const companyChanged =
    data.companyId !== undefined && data.companyId !== user.companyId;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(data.email !== undefined && { email: data.email.toLowerCase() }),
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.companyId !== undefined && { companyId: data.companyId }),
      ...(data.type !== undefined && { type: data.type }),
    },
    include: {
      company: { select: { id: true, name: true, type: true } },
      globalRoles: true,
    },
  });

  if (companyChanged) {
    const { ensureUserCompanyAffiliation } = await import("@/lib/user-company");
    const { revokeInvalidCoordinatorRoles } = await import("@/lib/coordinator-company");
    await ensureUserCompanyAffiliation(params.id, nextCompanyId);
    await revokeInvalidCoordinatorRoles(params.id);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  if (params.id === auth.user.id) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [documents, reports] = await Promise.all([
    prisma.document.count({ where: { uploadedBy: params.id } }),
    prisma.report.count({ where: { trainerId: params.id } }),
  ]);

  if (documents > 0 || reports > 0) {
    return NextResponse.json({ error: "has_dependencies" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.session.updateMany({
      where: { trainerId: params.id },
      data: { trainerId: null },
    }),
    prisma.certificate.updateMany({
      where: { unlockedBy: params.id },
      data: { unlockedBy: null },
    }),
    prisma.user.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
