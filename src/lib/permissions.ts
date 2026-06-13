import { cache } from "react";
import { AttendanceStatus, GlobalRole, ProjectRole, UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isUserAssignedToTraining } from "@/lib/user-training";

export type UserPermissions = {
  isInternal: boolean;
  isAdmin: boolean;
  isPlanner: boolean;
  isTrainer: boolean;
  projectRoles: { projectId: string; role: ProjectRole }[];
};

export function buildUserPermissions(
  userType: UserType | null | undefined,
  globalRoles: { role: GlobalRole }[],
  projectRoles: { projectId: string; role: ProjectRole }[]
): UserPermissions {
  return {
    isInternal: userType === UserType.internal,
    isAdmin: globalRoles.some((r) => r.role === GlobalRole.ADMIN),
    isPlanner: globalRoles.some((r) => r.role === GlobalRole.PLANNER),
    isTrainer: globalRoles.some((r) => r.role === GlobalRole.TRAINER),
    projectRoles: projectRoles.map((r) => ({
      projectId: r.projectId,
      role: r.role as ProjectRole,
    })),
  };
}

export const getUserPermissions = cache(async (userId: string): Promise<UserPermissions> => {
  const { getCurrentUser } = await import("@/lib/auth/get-current-user");
  const current = await getCurrentUser();
  if (current?.id === userId) {
    return current.permissions;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { type: true },
  });

  const [globalRoles, projectRoles] = await Promise.all([
    prisma.userGlobalRole.findMany({ where: { userId } }),
    prisma.userProjectRole.findMany({ where: { userId } }),
  ]);

  return buildUserPermissions(user?.type, globalRoles, projectRoles);
});

export function isStaff(perms: UserPermissions) {
  return perms.isAdmin || perms.isPlanner;
}

export async function canManageUsers(userId: string, perms?: UserPermissions) {
  const p = perms ?? (await getUserPermissions(userId));
  return p.isAdmin;
}

export async function canManageProjects(userId: string, perms?: UserPermissions) {
  const p = perms ?? (await getUserPermissions(userId));
  return isStaff(p);
}

type ProjectAccessSnapshot = {
  deletedAt: Date | null;
  companyId: string;
};

async function evaluateProjectAccess(
  userId: string,
  projectId: string,
  snapshot: ProjectAccessSnapshot,
  p: UserPermissions
) {
  if (snapshot.deletedAt && !(await canManageProjects(userId, p))) return false;

  if (p.isInternal) return true;
  if (isStaff(p)) return true;

  if (p.projectRoles.some((r) => r.projectId === projectId)) {
    const { ensureCoordinatorProjectAccess } = await import("@/lib/coordinator-project-role");
    const ok = await ensureCoordinatorProjectAccess(userId, projectId);
    if (ok) return true;
  }

  const enrolled = await prisma.userProgram.findFirst({
    where: { userId, program: { projectId } },
    select: { id: true },
  });
  return !!enrolled;
}

export async function canAccessProjectWithSnapshot(
  userId: string,
  projectId: string,
  snapshot: ProjectAccessSnapshot,
  perms?: UserPermissions
) {
  const p = perms ?? (await getUserPermissions(userId));
  return evaluateProjectAccess(userId, projectId, snapshot, p);
}

export async function canAccessProject(
  userId: string,
  projectId: string,
  perms?: UserPermissions
) {
  const p = perms ?? (await getUserPermissions(userId));

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { deletedAt: true, companyId: true },
  });
  if (!project) return false;
  return evaluateProjectAccess(userId, projectId, project, p);
}

export function projectListFilter(
  userId: string,
  perms: UserPermissions,
  options?: { deletedOnly?: boolean }
) {
  let accessFilter: Record<string, unknown> = {};

  if (!perms.isInternal && !isStaff(perms)) {
    const ids = perms.projectRoles.map((r) => r.projectId);
    accessFilter = {
      OR: [
        { id: { in: ids.length ? ids : ["__none__"] } },
        { programs: { some: { participants: { some: { userId } } } } },
      ],
    };
  }

  if (options?.deletedOnly) {
    return { ...accessFilter, deletedAt: { not: null } };
  }

  return { ...accessFilter, deletedAt: null };
}

export async function isProjectCoordinator(
  userId: string,
  projectId: string,
  perms?: UserPermissions,
  userCompanyId?: string
) {
  const p = perms ?? (await getUserPermissions(userId));
  const hasRole = p.projectRoles.some(
    (r) => r.projectId === projectId && r.role === ProjectRole.COORDINATOR
  );
  if (!hasRole) return false;

  const { ensureCoordinatorProjectAccess } = await import("@/lib/coordinator-project-role");
  return ensureCoordinatorProjectAccess(userId, projectId, userCompanyId);
}

export async function canManageProjectRoles(userId: string, perms?: UserPermissions) {
  return canManageProjects(userId, perms);
}

export async function canManageTrainingSessions(
  userId: string,
  projectId: string,
  perms?: UserPermissions
) {
  const p = perms ?? (await getUserPermissions(userId));
  if (p.isAdmin || p.isPlanner) return true;

  const { getCoordinatorProjectRole } = await import("@/lib/coordinator-project-role");
  const role = await getCoordinatorProjectRole(userId, projectId);
  return !!role?.canManageSessions;
}

export async function canManageProgramParticipants(
  userId: string,
  projectId: string,
  perms?: UserPermissions,
  userCompanyId?: string
) {
  if (await canManageProjects(userId, perms)) return true;
  if (!(await isProjectCoordinator(userId, projectId, perms, userCompanyId))) {
    return false;
  }

  const { getCoordinatorProjectRole } = await import("@/lib/coordinator-project-role");
  const role = await getCoordinatorProjectRole(userId, projectId);
  return !!role?.canAddParticipants;
}

export async function canManageAttendance(userId: string, sessionId: string) {
  if (await canManageProjects(userId)) return true;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      trainerId: true,
      training: { select: { program: { select: { projectId: true } } } },
    },
  });

  if (!session) return false;
  if (session.trainerId === userId) return true;

  return isProjectCoordinator(userId, session.training.program.projectId);
}

export async function canUnlockCertificate(userId: string, projectId: string) {
  return canManualUnlockCertificate(userId, projectId);
}

export async function canManualUnlockCertificate(
  userId: string,
  projectId: string,
  perms?: UserPermissions,
  userCompanyId?: string
) {
  const p = perms ?? (await getUserPermissions(userId));
  if (p.isAdmin || p.isPlanner) return true;
  if (!(await isProjectCoordinator(userId, projectId, p, userCompanyId))) {
    return false;
  }

  const { getCoordinatorProjectRole } = await import("@/lib/coordinator-project-role");
  const role = await getCoordinatorProjectRole(userId, projectId);
  return !!role?.canUnlockCertificates;
}

export async function isProgramParticipant(userId: string, programId: string) {
  const row = await prisma.userProgram.findUnique({
    where: { userId_programId: { userId, programId } },
    select: { id: true },
  });
  return !!row;
}

export async function canAccessProgram(
  userId: string,
  programId: string,
  perms?: UserPermissions
) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { projectId: true },
  });
  if (!program) return false;
  if (await canAccessProject(userId, program.projectId, perms)) return true;
  return isProgramParticipant(userId, programId);
}

export async function canViewAllFeedbacks(
  userId: string,
  projectId: string,
  perms?: UserPermissions
) {
  if (await canManageProjects(userId, perms)) return true;
  return isProjectCoordinator(userId, projectId, perms);
}

export async function canSubmitFeedback(userId: string, programId: string) {
  return isProgramParticipant(userId, programId);
}

export async function canSubmitTrainingFeedback(userId: string, trainingId: string) {
  if (!(await isUserAssignedToTraining(userId, trainingId))) return false;

  const attended = await prisma.sessionParticipant.findFirst({
    where: {
      userId,
      attendanceStatus: AttendanceStatus.present,
      session: {
        trainingId,
        status: { not: "cancelled" },
      },
    },
    select: { id: true },
  });

  return !!attended;
}

export async function canDownloadCertificate(
  userId: string,
  trainingId: string,
  targetUserId: string
) {
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { program: { select: { id: true, projectId: true } } },
  });
  if (!training) return false;
  if (await canManageProjects(userId)) return true;
  if (await isProjectCoordinator(userId, training.program.projectId)) return true;
  if (userId !== targetUserId) return false;
  return isUserAssignedToTraining(userId, trainingId);
}

export async function isParticipantOnly(userId: string, perms?: UserPermissions) {
  const p = perms ?? (await getUserPermissions(userId));
  if (p.isInternal || isStaff(p) || p.isTrainer) return false;
  if (
    p.projectRoles.some(
      (r) => r.role === ProjectRole.COORDINATOR || r.role === ProjectRole.TRAINER
    )
  ) {
    return false;
  }
  const enrolled = await prisma.userProgram.findFirst({
    where: { userId },
    select: { id: true },
  });
  return !!enrolled;
}

export async function canAccessTrainingWithProject(
  userId: string,
  trainingId: string,
  projectId: string,
  perms?: UserPermissions,
  options?: { isAssigned?: boolean }
) {
  const p = perms ?? (await getUserPermissions(userId));

  if (p.isInternal || isStaff(p)) return true;

  if (await canAccessProject(userId, projectId, p)) {
    const participantFast = resolveParticipantOnlyFast(p);
    const participantOnly =
      participantFast !== null
        ? participantFast
        : await isParticipantOnly(userId, p);
    if (participantOnly) {
      if (options?.isAssigned !== undefined) return options.isAssigned;
      return isUserAssignedToTraining(userId, trainingId);
    }
    return true;
  }
  return false;
}

export async function canAccessTrainingAsParticipant(
  userId: string,
  trainingId: string,
  perms?: UserPermissions
) {
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { programId: true, program: { select: { projectId: true } } },
  });
  if (!training) return false;
  return canAccessTrainingWithProject(
    userId,
    trainingId,
    training.program.projectId,
    perms
  );
}

export async function canAccessPlanning(userId: string, perms?: UserPermissions) {
  const p = perms ?? (await getUserPermissions(userId));
  const fast = resolvePlanningAccessFast(p);
  if (fast !== null) return fast;
  return resolvePlanningAccess(userId, p);
}

/** Résultat immédiat pour staff/formateurs ; `null` = vérification session requise. */
export function resolvePlanningAccessFast(perms: UserPermissions): boolean | null {
  if (isStaff(perms) || perms.isTrainer) return true;
  if (perms.projectRoles.some((r) => r.role === ProjectRole.TRAINER)) return true;
  return null;
}

export async function resolvePlanningAccess(userId: string, perms: UserPermissions) {
  const assigned = await prisma.session.findFirst({
    where: { trainerId: userId },
    select: { id: true },
  });
  return !!assigned;
}

/** Résultat immédiat si le rôle exclut participant-only ; `null` = requête BDD requise. */
export function resolveParticipantOnlyFast(perms: UserPermissions): boolean | null {
  if (perms.isInternal || isStaff(perms) || perms.isTrainer) return false;
  if (
    perms.projectRoles.some(
      (r) => r.role === ProjectRole.COORDINATOR || r.role === ProjectRole.TRAINER
    )
  ) {
    return false;
  }
  return null;
}
