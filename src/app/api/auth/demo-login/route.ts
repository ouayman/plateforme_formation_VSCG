import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo-mode";
import { resolveLandingPath } from "@/lib/auth/landing";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastSignInAt: new Date(),
      loginCount: { increment: 1 },
    },
  });

  await createSession({ userId: user.id, email: user.email });

  const redirectTo = await resolveLandingPath(user.id);

  return NextResponse.json({ ok: true, redirectTo });
}
