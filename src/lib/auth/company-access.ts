import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getActiveCompanyId, type ClientCompanyUser } from "@/lib/active-company";
import { canManageClientCompany } from "@/lib/permissions";

export async function requireCompanyManagementApi(companyId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  if (user.permissions.isAdmin) {
    return { user };
  }

  const activeCompanyId = await getActiveCompanyId(user.id, user as ClientCompanyUser);
  if (activeCompanyId !== companyId) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  if (!(await canManageClientCompany(user.id, companyId, user.permissions))) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  return { user };
}
