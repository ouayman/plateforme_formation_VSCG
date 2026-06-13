import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";
import { isDemoMode } from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

const DEMO_USERS_TAKE = 50;

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  const settingsPromise = getPlatformSettings();

  const start = Date.now();
  const users = await prisma.user.findMany({
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
  });
  console.log("DEMO USERS QUERY:", Date.now() - start, "ms");

  const settings = await settingsPromise;

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
        projectName: "",
      })),
      isParticipant: user._count.programs > 0,
    })),
    { headers: { "Cache-Control": "no-store" } }
  );
}
