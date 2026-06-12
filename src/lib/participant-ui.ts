import type { getParticipantTrainings } from "@/lib/participant";
import type { ParticipantCalendarSession } from "@/components/features/participant/participant-month-calendar";
import type { ParticipantFormationRow } from "@/components/features/participant/participant-formations-view";

type Trainings = Awaited<ReturnType<typeof getParticipantTrainings>>;

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function mapParticipantUiData(trainings: Trainings) {
  const now = new Date();

  const calendarSessions: ParticipantCalendarSession[] = trainings.flatMap((training) =>
    training.sessions.map((session) => ({
      id: session.id,
      trainingId: training.id,
      trainingTitle: training.title,
      programName: training.programName,
      projectId: training.projectId,
      startDatetime: toIso(session.startDatetime),
      endDatetime: toIso(session.endDatetime),
      locationName: session.locationName,
    }))
  );

  const formationRows: ParticipantFormationRow[] = trainings.map((training) => {
    const nextSession = training.sessions.find((s) => new Date(s.startDatetime) >= now);
    const pastSessions = training.sessions.filter((s) => new Date(s.startDatetime) < now);
    const attendedCount = pastSessions.filter((s) => s.attendanceStatus === "present").length;
    const sessionCount = training.sessionCount;

    return {
      id: training.id,
      title: training.title,
      description: training.description,
      programName: training.programName,
      projectName: training.projectName,
      projectId: training.projectId,
      sessionCount,
      documentCount: training.documentCount,
      certificateStatus: training.certificate?.status ?? null,
      hasFeedback: training.hasFeedback,
      nextSessionDate: nextSession ? toIso(nextSession.startDatetime) : null,
      progressPercent:
        sessionCount > 0
          ? Math.round((pastSessions.length / sessionCount) * 100)
          : 0,
      attendancePercent:
        pastSessions.length > 0
          ? Math.round((attendedCount / pastSessions.length) * 100)
          : 0,
      attendedSessions: attendedCount,
      completedSessions: pastSessions.length,
    };
  });

  const upcomingSessions = calendarSessions
    .filter((s) => new Date(s.startDatetime) >= now)
    .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());

  return { calendarSessions, formationRows, upcomingSessions };
}
