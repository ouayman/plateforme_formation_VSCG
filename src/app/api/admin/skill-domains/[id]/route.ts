import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { updateSkillDomainSchema } from "@/lib/validations/skill-domain";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = updateSkillDomainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const domain = await prisma.skillDomain.findUnique({ where: { id: params.id } });
  if (!domain) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (parsed.data.name && parsed.data.name !== domain.name) {
    const duplicate = await prisma.skillDomain.findUnique({
      where: { name: parsed.data.name },
    });
    if (duplicate) {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
  }

  const updated = await prisma.skillDomain.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const domain = await prisma.skillDomain.findUnique({ where: { id: params.id } });
  if (!domain) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.skillDomain.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
