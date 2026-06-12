import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canManageProgramParticipants } from "@/lib/permissions";
import { lookupParticipantByEmail } from "@/lib/participant-lookup";

async function getProgramContext(programId: string) {
  return prisma.program.findUnique({
    where: { id: programId },
    select: { projectId: true },
  });
}

export async function GET(
  req: Request,
  { params }: { params: { programId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ctx = await getProgramContext(params.programId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await canManageProgramParticipants(user.id, ctx.projectId);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const email = new URL(req.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  const result = await lookupParticipantByEmail(user.id, params.programId, email);
  return NextResponse.json(result);
}
