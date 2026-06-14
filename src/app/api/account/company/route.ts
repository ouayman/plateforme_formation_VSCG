import { NextResponse } from "next/server";
import { CompanyType } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getActiveCompanyId, type ClientCompanyUser } from "@/lib/active-company";
import { invalidateClientCompaniesCache } from "@/lib/cache/client-companies";
import { prisma } from "@/lib/prisma";
import { canManageClientCompany } from "@/lib/permissions";
import { clientUpdateCompanySchema } from "@/lib/validations/company";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const activeCompanyId = await getActiveCompanyId(user.id, user as ClientCompanyUser);
  if (!activeCompanyId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!(await canManageClientCompany(user.id, activeCompanyId, user.permissions))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = clientUpdateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: activeCompanyId },
    select: { id: true, type: true },
  });

  if (!company || company.type !== CompanyType.client) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.company.update({
    where: { id: activeCompanyId },
    data: { name: parsed.data.name },
    select: { id: true, name: true, logoUrl: true },
  });

  invalidateClientCompaniesCache();
  return NextResponse.json(updated);
}
