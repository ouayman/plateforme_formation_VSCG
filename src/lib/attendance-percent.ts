import { AttendanceStatus } from "@prisma/client";

export function computeAttendancePercent(
  sessions: { attendanceStatus: AttendanceStatus | null }[]
) {
  if (sessions.length === 0) return null;
  const eligible = sessions.filter(
    (s) => s.attendanceStatus !== AttendanceStatus.absent
  ).length;
  return Math.round((eligible / sessions.length) * 100);
}
