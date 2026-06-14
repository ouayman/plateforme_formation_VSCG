import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require";
import { validateImageUpload } from "@/lib/image-upload-utils";
import { prisma } from "@/lib/prisma";
import { safeDeleteStoredFile, saveCompanyLogo } from "@/lib/uploads";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
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
    return NextResponse.json({ path: storedPath, company: updated });
  } catch (error) {
    console.error("[company-logo] upload failed:", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
