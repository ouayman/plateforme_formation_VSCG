export type TaskStatus = "upcoming" | "overdue" | "done";

type ParticipantRow = { attendanceStatus: string | null };

export function getAttendanceTaskStatus(
  endDatetime: Date | string,
  participants: ParticipantRow[]
): TaskStatus {
  const end = typeof endDatetime === "string" ? new Date(endDatetime) : endDatetime;
  const allSet =
    participants.length > 0 &&
    participants.every((p) => p.attendanceStatus !== null);

  if (allSet) return "done";
  if (new Date() < end) return "upcoming";
  return "overdue";
}

export function getReportTaskStatus(
  endDatetime: Date | string,
  hasReport: boolean
): TaskStatus {
  if (hasReport) return "done";
  const end = typeof endDatetime === "string" ? new Date(endDatetime) : endDatetime;
  if (new Date() < end) return "upcoming";
  return "overdue";
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  upcoming: "À venir",
  overdue: "En retard",
  done: "Fait",
};

export const TASK_STATUS_STYLES: Record<
  TaskStatus,
  { className: string; dotClass: string }
> = {
  upcoming: {
    className: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
    dotClass: "bg-slate-400",
  },
  overdue: {
    className: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    dotClass: "bg-amber-500",
  },
  done: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    dotClass: "bg-emerald-500",
  },
};

export const PROJECT_COLORS = [
  "#CD3465",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#ef4444",
  "#6366f1",
];

export function projectColor(projectId: string) {
  let hash = 0;
  for (let i = 0; i < projectId.length; i += 1) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}
