import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { isDemoMode } from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  const [users, settings] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ type: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        type: true,
        company: { select: { name: true } },
        globalRoles: { select: { role: true } },
        projectRoles: {
          select: {
            role: true,
            project: { select: { name: true } },
          },
        },
        programs: { select: { id: true }, take: 1 },
      },
    }),
    getPlatformSettings(),
  ]);

  return NextResponse.json(
    users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      type: user.type,
      companyName:
        user.type === UserType.internal ? settings.organizationName : user.company.name,
      globalRoles: user.globalRoles.map((r) => r.role),
      projectRoles: user.projectRoles.map((r) => ({
        role: r.role,
        projectName: r.project.name,
      })),
      isParticipant: user.programs.length > 0,
    })),
    { headers: { "Cache-Control": "no-store" } }
  );
}
