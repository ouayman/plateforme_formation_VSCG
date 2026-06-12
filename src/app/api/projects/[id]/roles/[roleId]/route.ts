import { NextResponse } from "next/server";
import { ProjectRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageProjectRoles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { projectRolePatchSchema } from "@/lib/validations/settings";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; roleId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await canManageProjectRoles(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = projectRolePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const role = await prisma.userProjectRole.findUnique({
    where: { id: params.roleId, projectId: params.id },
  });

  if (!role) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (role.role !== ProjectRole.COORDINATOR) {
    return NextResponse.json({ error: "coordinator_only" }, { status: 400 });
  }

  const data: {
    canAddParticipants?: boolean;
    canPublishFeed?: boolean;
    canUnlockCertificates?: boolean;
    canManageSessions?: boolean;
  } = {};
  if (parsed.data.canAddParticipants !== undefined) {
    data.canAddParticipants = parsed.data.canAddParticipants;
  }
  if (parsed.data.canPublishFeed !== undefined) {
    data.canPublishFeed = parsed.data.canPublishFeed;
  }
  if (parsed.data.canUnlockCertificates !== undefined) {
    data.canUnlockCertificates = parsed.data.canUnlockCertificates;
  }
  if (parsed.data.canManageSessions !== undefined) {
    data.canManageSessions = parsed.data.canManageSessions;
  }

  const updated = await prisma.userProjectRole.update({
    where: { id: params.roleId },
    data,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, type: true },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; roleId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await canManageProjectRoles(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.userProjectRole.delete({
    where: { id: params.roleId, projectId: params.id },
  });

  return NextResponse.json({ ok: true });
}
