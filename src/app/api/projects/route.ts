import { NextResponse } from "next/server";
import { CompanyType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { projectListFilter } from "@/lib/permissions";
import { projectSchema } from "@/lib/validations/project";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: projectListFilter(user.id, user.permissions),
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      companyId: true,
      startDate: true,
      endDate: true,
      deletedAt: true,
      company: { select: { id: true, name: true } },
      _count: { select: { programs: true, locations: true } },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: parsed.data.companyId },
  });

  if (!company || company.type !== CompanyType.client) {
    return NextResponse.json({ error: "invalid_company" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      companyId: parsed.data.companyId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
    select: {
      id: true,
      name: true,
      companyId: true,
      startDate: true,
      endDate: true,
      company: { select: { id: true, name: true } },
      _count: { select: { programs: true, locations: true } },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
