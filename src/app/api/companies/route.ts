import { NextResponse } from "next/server";
import { CompanyType } from "@prisma/client";
import { invalidateClientCompaniesCache } from "@/lib/cache/client-companies";
import { requireAdminApi, requireStaffApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { createCompanySchema } from "@/lib/validations/company";

export async function GET() {
  const auth = await requireStaffApi();
  if (auth.error) return auth.error;

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, projects: true } } },
  });

  return NextResponse.json(companies);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { name, logoUrl } = parsed.data;

  const company = await prisma.company.create({
    data: {
      name,
      type: CompanyType.client,
      logoUrl: logoUrl || null,
    },
  });

  invalidateClientCompaniesCache();

  return NextResponse.json(company, { status: 201 });
}
