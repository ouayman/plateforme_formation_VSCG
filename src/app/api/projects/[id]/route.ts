import { NextResponse } from "next/server";
import { CompanyType } from "@prisma/client";
import { requireProjectAccessApi, requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations/project";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireProjectAccessApi(params.id);
  if (auth.error) return auth.error;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { id: true, name: true } },
      locations: { orderBy: { name: "asc" } },
      signatories: { orderBy: { name: "asc" } },
      _count: { select: { programs: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ...project, canEdit: auth.canEdit });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      deletedAt: true,
      companyId: true,
      _count: {
        select: {
          signatories: true,
          projectRoles: true,
        },
      },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (existing.deletedAt) {
    return NextResponse.json({ error: "project_deleted" }, { status: 409 });
  }

  if (
    parsed.data.companyId !== existing.companyId &&
    (existing._count.projectRoles > 0 || existing._count.signatories > 0)
  ) {
    return NextResponse.json({ error: "company_locked" }, { status: 409 });
  }

  const company = await prisma.company.findUnique({
    where: { id: parsed.data.companyId },
  });

  if (!company || company.type !== CompanyType.client) {
    return NextResponse.json({ error: "invalid_company" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name,
      companyId: parsed.data.companyId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
    include: {
      company: { select: { id: true, name: true } },
      _count: { select: { programs: true, locations: true } },
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { deletedAt: true },
  });
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (project.deletedAt) {
    return NextResponse.json({ ok: true });
  }

  await prisma.project.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
