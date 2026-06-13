import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { updateAccountSchema } from "@/lib/validations/user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fullUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      type: true,
      company: { select: { name: true } },
      globalRoles: { select: { role: true } },
      projectRoles: { select: { role: true, projectId: true } },
    },
  });

  return NextResponse.json({
    id: fullUser.id,
    email: fullUser.email,
    firstName: fullUser.firstName,
    lastName: fullUser.lastName,
    type: fullUser.type,
    company: fullUser.company.name,
    globalRoles: fullUser.globalRoles.map((r) => r.role),
    projectRoles: fullUser.projectRoles.map((r) => ({
      role: r.role,
      projectId: r.projectId,
    })),
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  return NextResponse.json(updated);
}
