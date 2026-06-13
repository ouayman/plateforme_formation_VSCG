import { NextResponse } from "next/server";
import { ProjectRole, UserType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageProjectRoles } from "@/lib/permissions";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { projectRoleSchema } from "@/lib/validations/participant";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const access = await requireProjectAccessApi(params.id);
  if (access.error) return access.error;

  const roles = await prisma.userProjectRole.findMany({
    where: { projectId: params.id },
    select: {
      id: true,
      projectId: true,
      userId: true,
      role: true,
      canAddParticipants: true,
      canPublishFeed: true,
      canUnlockCertificates: true,
      canManageSessions: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, type: true },
      },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  return NextResponse.json(roles);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await canManageProjectRoles(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = projectRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { companyId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, type: true, companyId: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  if (parsed.data.role === ProjectRole.TRAINER) {
    return NextResponse.json({ error: "trainer_on_session_only" }, { status: 400 });
  }

  if (parsed.data.role === ProjectRole.COORDINATOR) {
    if (
      targetUser.type !== UserType.client ||
      targetUser.companyId !== project.companyId
    ) {
      return NextResponse.json({ error: "invalid_coordinator" }, { status: 400 });
    }
  }

  const existing = await prisma.userProjectRole.findUnique({
    where: {
      userId_projectId_role: {
        userId: parsed.data.userId,
        projectId: params.id,
        role: parsed.data.role,
      },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "duplicate" }, { status: 409 });
  }

  const role = await prisma.userProjectRole.create({
    data: {
      projectId: params.id,
      userId: parsed.data.userId,
      role: parsed.data.role,
      ...(parsed.data.role === ProjectRole.COORDINATOR && {
        canAddParticipants: parsed.data.canAddParticipants ?? false,
        canPublishFeed: parsed.data.canPublishFeed ?? false,
        canUnlockCertificates: parsed.data.canUnlockCertificates ?? false,
        canManageSessions: parsed.data.canManageSessions ?? false,
      }),
    },
    select: {
      id: true,
      projectId: true,
      userId: true,
      role: true,
      canAddParticipants: true,
      canPublishFeed: true,
      canUnlockCertificates: true,
      canManageSessions: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, type: true },
      },
    },
  });

  return NextResponse.json(role, { status: 201 });
}
