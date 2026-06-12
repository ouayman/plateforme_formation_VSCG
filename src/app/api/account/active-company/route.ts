import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getActiveCompanyId,
  getUserCompanyOptions,
  setActiveCompanyCookie,
} from "@/lib/active-company";

const schema = z.object({ companyId: z.string().min(1) });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const companies = await getUserCompanyOptions(user.id);
  const activeCompanyId = await getActiveCompanyId(user.id);

  return NextResponse.json({ companies, activeCompanyId });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const companies = await getUserCompanyOptions(user.id);
  if (!companies.some((c) => c.id === parsed.data.companyId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  setActiveCompanyCookie(parsed.data.companyId);
  return NextResponse.json({ ok: true, activeCompanyId: parsed.data.companyId });
}
