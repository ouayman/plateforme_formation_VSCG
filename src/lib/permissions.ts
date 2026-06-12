import { AttendanceStatus, GlobalRole, ProjectRole, UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isUserAssignedToTraining } from "@/lib/user-training";

export async function getUserPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { type: true },
  });

  const [globalRoles, projectRoles] = await Promise.all([
    prisma.userGlobalRole.findMany({ where: { userId } }),
    prisma.userProjectRole.findMany({ where: { userId } }),
  ]);

  return {
    isInternal: user?.type === UserType.internal,
    isAdmin: globalRoles.some((r) => r.role === GlobalRole.ADMIN),
    isPlanner: globalRoles.some((r) => r.role === GlobalRole.PLANNER),
    isTrainer: globalRoles.some((r) => r.role === GlobalRole.TRAINER),
    projectRoles: projectRoles.map((r) => ({
      projectId: r.projectId,
      role: r.role as ProjectRole,
    })),
  };
}

export function isStaff(perms: Awaited<ReturnType<typeof getUserPermissions>>) {
  return perms.isAdmin || perms.isPlanner;
}

export async function canManageUsers(userId: string) {
  const perms = await getUserPermissions(userId);
  return perms.isAdmin;
}

export async function canManageProjects(userId: string) {
  const perms = await getUserPermissions(userId);
  return isStaff(perms);
}

export async function canAccessProject(userId: string, projectId: string) {
  const perms = await getUserPermissions(userId);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { deletedAt: true, companyId: true },
  });
  if (!project) return false;
  if (project.deletedAt && !(await canManageProjects(userId))) return false;

  if (perms.isInternal) return true;
  if (isStaff(perms)) return true;

  if (perms.projectRoles.some((r) => r.projectId === projectId)) {
    const { ensureCoordinatorProjectAccess } = await import("@/lib/coordinator-company");
    const ok = await ensureCoordinatorProjectAccess(userId, projectId);
    if (ok) return true;
  }

  const enrolled = await prisma.userProgram.findFirst({
    where: { userId, program: { projectId } },
    select: { id: true },
  });
  return !!enrolled;
}

export function projectListFilter(
  userId: string,
  perms: Awaited<ReturnType<typeof getUserPermissions>>,
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

export async function isProjectCoordinator(userId: string, projectId: string) {
  const perms = await getUserPermissions(userId);
  const hasRole = perms.projectRoles.some(
    (r) => r.projectId === projectId && r.role === ProjectRole.COORDINATOR
  );
  if (!hasRole) return false;

  const { ensureCoordinatorProjectAccess } = await import("@/lib/coordinator-company");
  return ensureCoordinatorProjectAccess(userId, projectId);
}

export async function canManageProjectRoles(userId: string) {
  return canManageProjects(userId);
}

export async function canManageTrainingSessions(userId: string, projectId: string) {
  const perms = await getUserPermissions(userId);
  if (perms.isAdmin || perms.isPlanner) return true;

  const coordinator = await prisma.userProjectRole.findFirst({
    where: {
      userId,
      projectId,
      role: ProjectRole.COORDINATOR,
      canManageSessions: true,
    },
    select: { id: true },
  });
  return !!coordinator;
}

export async function canManageProgramParticipants(userId: string, projectId: string) {
  if (await canManageProjects(userId)) return true;
  if (!(await isProjectCoordinator(userId, projectId))) return false;

  const coordinatorRole = await prisma.userProjectRole.findFirst({
    where: {
      userId,
      projectId,
      role: ProjectRole.COORDINATOR,
      canAddParticipants: true,
    },
    select: { id: true },
  });

  return !!coordinatorRole;
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

export async function canManualUnlockCertificate(userId: string, projectId: string) {
  const perms = await getUserPermissions(userId);
  if (perms.isAdmin || perms.isPlanner) return true;
  if (!(await isProjectCoordinator(userId, projectId))) return false;

  const coordinator = await prisma.userProjectRole.findFirst({
    where: {
      userId,
      projectId,
      role: ProjectRole.COORDINATOR,
      canUnlockCertificates: true,
    },
    select: { id: true },
  });
  return !!coordinator;
}

export async function isProgramParticipant(userId: string, programId: string) {
  const row = await prisma.userProgram.findUnique({
    where: { userId_programId: { userId, programId } },
    select: { id: true },
  });
  return !!row;
}

export async function canAccessProgram(userId: string, programId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { projectId: true },
  });
  if (!program) return false;
  if (await canAccessProject(userId, program.projectId)) return true;
  return isProgramParticipant(userId, programId);
}

export async function canViewAllFeedbacks(userId: string, projectId: string) {
  if (await canManageProjects(userId)) return true;
  return isProjectCoordinator(userId, projectId);
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

export async function isParticipantOnly(userId: string) {
  const perms = await getUserPermissions(userId);
  if (perms.isInternal || isStaff(perms) || perms.isTrainer) return false;
  if (
    perms.projectRoles.some(
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

export async function canAccessTrainingAsParticipant(userId: string, trainingId: string) {
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { programId: true, program: { select: { projectId: true } } },
  });
  if (!training) return false;
  if (await canAccessProject(userId, training.program.projectId)) {
    if (await isParticipantOnly(userId)) {
      return isUserAssignedToTraining(userId, trainingId);
    }
    return true;
  }
  return false;
}

export async function canAccessPlanning(userId: string) {
  if (await canManageProjects(userId)) return true;
  const perms = await getUserPermissions(userId);
  if (perms.isTrainer) return true;
  if (perms.projectRoles.some((r) => r.role === ProjectRole.TRAINER)) return true;
  const assigned = await prisma.session.findFirst({
    where: { trainerId: userId },
    select: { id: true },
  });
  return !!assigned;
}
