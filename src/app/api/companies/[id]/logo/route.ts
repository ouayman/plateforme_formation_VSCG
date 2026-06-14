import { NextResponse } from "next/server";
import { invalidateClientCompaniesCache } from "@/lib/cache/client-companies";
import { requireCompanyManagementApi } from "@/lib/auth/company-access";
import { requireAdminApi } from "@/lib/auth/require";
import { validateImageUpload } from "@/lib/image-upload-utils";
import { prisma } from "@/lib/prisma";
import { safeDeleteStoredFile, saveCompanyLogo } from "@/lib/uploads";

async function authorizeLogoAccess(companyId: string) {
  const admin = await requireAdminApi();
  if (!admin.error) return admin;
  return requireCompanyManagementApi(companyId);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authorizeLogoAccess(params.id);
  if (auth.error) return auth.error;

  const company = await prisma.company.findUnique({ where: { id: params.id } });
  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const validationError = validateImageUpload(file.name, file.size);
  if (validationError) {
    return NextResponse.json({ error: "invalid_file", message: validationError }, { status: 400 });
  }

  try {
    const storedPath = await saveCompanyLogo(params.id, file);
    const updated = await prisma.company.update({
      where: { id: params.id },
      data: { logoUrl: storedPath },
    });
    await safeDeleteStoredFile(company.logoUrl);
    invalidateClientCompaniesCache();
    return NextResponse.json({ path: storedPath, company: updated });
  } catch (error) {
    console.error("[company-logo] upload failed:", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authorizeLogoAccess(params.id);
  if (auth.error) return auth.error;

  const company = await prisma.company.findUnique({ where: { id: params.id } });
  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!company.logoUrl) {
    return NextResponse.json({ ok: true });
  }

  try {
    await safeDeleteStoredFile(company.logoUrl);
    await prisma.company.update({
      where: { id: params.id },
      data: { logoUrl: null },
    });
    invalidateClientCompaniesCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[company-logo] delete failed:", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
