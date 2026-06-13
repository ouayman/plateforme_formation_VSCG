import "server-only";

import { ProjectRole, SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { getCurrentUser } from "@/lib/auth/get-current-user";
import type { UserPermissions } from "@/lib/permissions";
import { isStaff } from "@/lib/permissions";

type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

const sessionListSelect = {
  location: { select: { name: true } },
  training: {
    select: {
      id: true,
      title: true,
      program: {
        select: {
          name: true,
          project: {
            select: {
              id: true,
              name: true,
              company: { select: { name: true } },
            },
          },
        },
      },
    },
  },
} as const;

export type PlanningCalendarSession = {
  id: string;
  trainingId: string;
  startDatetime: string;
  endDatetime: string;
  trainingTitle: string;
  projectId: string;
  projectName: string;
  companyName: string;
};

export type ParticipantPlanningCalendarSession = {
  id: string;
  trainingId: string;
  trainingTitle: string;
  programName: string;
  projectId: string;
  startDatetime: string;
  endDatetime: string;
  locationName: string | null;
};

function mapStaffSessionRows(
  sessions: {
    id: string;
    startDatetime: Date;
    endDatetime: Date;
    training: {
      id: string;
      title: string;
      program: {
        project: { id: string; name: string; company: { name: string } };
      };
    };
  }[]
): PlanningCalendarSession[] {
  return sessions.map((session) => ({
    id: session.id,
    trainingId: session.training.id,
    startDatetime: session.startDatetime.toISOString(),
    endDatetime: session.endDatetime.toISOString(),
    trainingTitle: session.training.title,
    projectId: session.training.program.project.id,
    projectName: session.training.program.project.name,
    companyName: session.training.program.project.company.name,
  }));
}

function buildSessionFilter(user: AuthUser, perms: UserPermissions) {
  if (perms.isTrainer) {
    return {
      status: { not: SessionStatus.cancelled },
      OR: [{ trainerId: user.id }, { trainers: { some: { userId: user.id } } }],
    };
  }

  if (isStaff(perms)) {
    return { status: { not: SessionStatus.cancelled } };
  }

  return {
    status: { not: SessionStatus.cancelled },
    OR: [{ trainerId: user.id }, { trainers: { some: { userId: user.id } } }],
  };
}

export async function loadStaffPlanningSessions(user: AuthUser, perms: UserPermissions) {
  const sessions = await prisma.session.findMany({
    where: buildSessionFilter(user, perms),
    orderBy: { startDatetime: "asc" },
    select: {
      id: true,
      startDatetime: true,
      endDatetime: true,
      ...sessionListSelect,
    },
  });

  return mapStaffSessionRows(sessions);
}

export async function loadTrainerPlanningData(user: AuthUser) {
  const [sessions, unavailabilities] = await Promise.all([
    prisma.session.findMany({
      where: {
        status: { not: SessionStatus.cancelled },
        OR: [{ trainerId: user.id }, { trainers: { some: { userId: user.id } } }],
      },
      orderBy: { startDatetime: "asc" },
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
        ...sessionListSelect,
      },
    }),
    prisma.trainerUnavailability.findMany({
      where: { userId: user.id },
      orderBy: { startDatetime: "asc" },
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
      },
    }),
  ]);

  return {
    sessions: mapStaffSessionRows(sessions),
    unavailabilities: unavailabilities.map((u) => ({
      id: u.id,
      startDatetime: u.startDatetime.toISOString(),
      endDatetime: u.endDatetime.toISOString(),
    })),
  };
}

export async function verifyTrainerPlanningAccess(userId: string, perms: UserPermissions) {
  if (perms.isTrainer || isStaff(perms)) {
    return true;
  }

  const hasTrainerProjectRole = perms.projectRoles.some(
    (r) => r.role === ProjectRole.TRAINER
  );
  if (hasTrainerProjectRole) {
    return true;
  }

  const row = await prisma.session.findFirst({
    where: { trainerId: userId },
    select: { id: true },
  });

  return !!row;
}

/** Sessions calendrier participant — sans certificats/feedbacks/posts. */
export async function loadParticipantPlanningSessions(
  userId: string,
  companyId?: string | null
) {
  const assignments = await prisma.userTraining.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(companyId
        ? { training: { program: { project: { companyId } } } }
        : {}),
    },
    select: {
      training: {
        select: {
          id: true,
          title: true,
          program: {
            select: {
              name: true,
              project: { select: { id: true } },
            },
          },
          sessions: {
            where: { status: { not: SessionStatus.cancelled } },
            orderBy: { startDatetime: "asc" },
            select: {
              id: true,
              startDatetime: true,
              endDatetime: true,
              location: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { training: { program: { name: "asc" } } },
  });

  const calendarSessions: ParticipantPlanningCalendarSession[] = [];

  for (const { training } of assignments) {
    for (const session of training.sessions) {
      calendarSessions.push({
        id: session.id,
        trainingId: training.id,
        trainingTitle: training.title,
        programName: training.program.name,
        projectId: training.program.project.id,
        startDatetime: session.startDatetime.toISOString(),
        endDatetime: session.endDatetime.toISOString(),
        locationName: session.location?.name ?? null,
      });
    }
  }

  return calendarSessions;
}

export function splitParticipantPlanningSessions(
  sessions: ParticipantPlanningCalendarSession[]
) {
  const now = new Date();
  const upcomingSessions = sessions
    .filter((s) => new Date(s.startDatetime) >= now)
    .sort(
      (a, b) =>
        new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
    );

  return { calendarSessions: sessions, upcomingSessions };
}
