import { NextResponse } from "next/server";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { signatorySchema } from "@/lib/validations/project";

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
  const parsed = signatorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const signatory = await prisma.projectSignatory.create({
    data: {
      projectId: params.id,
      name: parsed.data.name,
      title: parsed.data.title,
      signatureImageUrl: parsed.data.signatureImageUrl || "",
    },
  });

  return NextResponse.json(signatory, { status: 201 });
}
