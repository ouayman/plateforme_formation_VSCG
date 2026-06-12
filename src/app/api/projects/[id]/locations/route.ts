import { NextResponse } from "next/server";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { locationSchema } from "@/lib/validations/project";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
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

  const location = await prisma.projectLocation.create({
    data: {
      projectId: params.id,
      name: parsed.data.name,
      address: parsed.data.address || null,
      instructions: parsed.data.instructions || null,
    },
  });

  return NextResponse.json(location, { status: 201 });
}
