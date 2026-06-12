import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canManageProjects } from "@/lib/permissions";

export type ParticipantLookupResult =
  | { found: false }
  | {
      found: true;
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      fieldsReadOnly: boolean;
      alreadyInProgram: boolean;
    };

export async function lookupParticipantByEmail(
  actorUserId: string,
  programId: string,
  email: string
): Promise<ParticipantLookupResult> {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { project: { select: { companyId: true } } },
  });
  if (!program) return { found: false };

  const normalized = email.trim().toLowerCase();
  const isStaff = await canManageProjects(actorUserId);
  const projectCompanyId = program.project.companyId;

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      companyId: true,
      type: true,
      companies: { select: { companyId: true } },
      programs: { where: { programId }, select: { id: true } },
    },
  });

  if (!user) return { found: false };

  const affiliatedCompanyIds = new Set([
    user.companyId,
    ...user.companies.map((c) => c.companyId),
  ]);

  if (!isStaff && !affiliatedCompanyIds.has(projectCompanyId)) {
    return { found: false };
  }

  if (user.type !== UserType.client) {
    return { found: false };
  }

  const fieldsReadOnly = !isStaff && user.companyId !== projectCompanyId;

  return {
    found: true,
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fieldsReadOnly,
    alreadyInProgram: user.programs.length > 0,
  };
}

export async function canEditParticipantIdentity(
  actorUserId: string,
  targetUserId: string,
  projectCompanyId: string
) {
  if (await canManageProjects(actorUserId)) return true;

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { companyId: true },
  });
  return user?.companyId === projectCompanyId;
}
