import { NextResponse } from "next/server";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { locationSchema } from "@/lib/validations/project";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; locationId: string } }
) {
  const access = await requireProjectAccessApi(params.id);
  if (access.error) return access.error;
  if (!access.canEdit) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const location = await prisma.projectLocation.update({
    where: { id: params.locationId, projectId: params.id },
    data: {
      name: parsed.data.name,
      address: parsed.data.address || null,
      instructions: parsed.data.instructions || null,
    },
  });

  return NextResponse.json(location);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; locationId: string } }
) {
  const access = await requireProjectAccessApi(params.id);
  if (access.error) return access.error;
  if (!access.canEdit) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.projectLocation.delete({
    where: { id: params.locationId, projectId: params.id },
  });

  return NextResponse.json({ ok: true });
}
