import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { getCachedOrganizationName } from "@/lib/cache/organization-name";
import { isDemoMode } from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEMO_USERS_TAKE = 50;

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  const [users, organizationName] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ type: "asc" }, { lastName: "asc" }],
      take: DEMO_USERS_TAKE,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        type: true,
        company: { select: { name: true } },
        globalRoles: { select: { role: true } },
        projectRoles: { select: { role: true } },
        _count: { select: { programs: true } },
      },
    }),
    getCachedOrganizationName(),
  ]);

  const payload = users.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    type: user.type,
    companyName:
      user.type === UserType.internal ? organizationName : user.company.name,
    globalRoles: user.globalRoles.map((r) => r.role),
    projectRoles: user.projectRoles.map((r) => ({
      role: r.role,
      projectName: "",
    })),
    isParticipant: user._count.programs > 0,
  }));

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
