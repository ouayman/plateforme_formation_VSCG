"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, List } from "lucide-react";
import { WeekNavigator } from "@/components/features/planning/week-navigator";
import { SessionTaskButton } from "@/components/features/trainings/session-task-button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { formatDatetime } from "@/lib/format";
import {
  getWeekDays,
  isToday,
  startOfWeek,
  toDateKey,
} from "@/lib/calendar-week";
import {
  getAttendanceTaskStatus,
  getReportTaskStatus,
  projectColor,
} from "@/lib/session-tasks";

type SessionItem = {
  id: string;
  startDatetime: string;
  endDatetime: string;
  trainingTitle: string;
  programName: string;
  projectId: string;
  projectName: string;
  trainingId: string;
  locationName: string | null;
  trainerName: string | null;
  hasReport: boolean;
  participants: { attendanceStatus: string | null }[];
};

type TrainerPlanningPanelProps = {
  sessions: SessionItem[];
  projects: { id: string; name: string }[];
};

export function TrainerPlanningPanel({ sessions, projects }: TrainerPlanningPanelProps) {
  const [view, setView] = useState<"planning" | "list">("planning");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      const key = toDateKey(session.startDatetime);
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return map;
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Aucune session"
        description="Vos sessions planifiées apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-4 px-2 pb-2 pt-3">
      <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {projects.map((project) => (
            <span
              key={project.id}
              className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: projectColor(project.id) }}
              />
              {project.name}
            </span>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
          {(
            [
              { value: "planning", label: "Planning", icon: CalendarDays },
              { value: "list", label: "Liste", icon: List },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "planning" ? (
        <div className="space-y-3 overflow-x-auto px-2">
          <WeekNavigator weekStart={weekStart} onWeekStartChange={setWeekStart} />
          <div className="grid min-w-[720px] grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const key = day.toDateString();
              const daySessions = sessionsByDay.get(key) ?? [];
              const today = isToday(day);
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[160px] rounded-xl border bg-white p-2",
                    today && "border-primary/30 ring-1 ring-primary/10"
                  )}
                >
                  <p
                    className={cn(
                      "mb-2 text-center text-[11px] font-semibold uppercase tracking-wide",
                      today ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}
                  </p>
                  <div className="space-y-2">
                    {daySessions.map((session) => {
                      const accent = projectColor(session.projectId);
                      return (
                        <div
                          key={session.id}
                          className="rounded-lg border p-2 text-[11px]"
                          style={{ borderLeftWidth: 3, borderLeftColor: accent }}
                        >
                          <p className="font-semibold">{session.trainingTitle}</p>
                          <p className="text-muted-foreground">{session.projectName}</p>
                          <p className="mt-1 text-muted-foreground">
                            {new Date(session.startDatetime).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <div className="mt-2 flex flex-col gap-1">
                            <SessionTaskButton
                              href={`/sessions/${session.id}#emargement`}
                              label="Présence"
                              status={getAttendanceTaskStatus(
                                session.endDatetime,
                                session.participants
                              )}
                              icon="attendance"
                            />
                            <SessionTaskButton
                              href={`/sessions/${session.id}#compte-rendu`}
                              label="CR"
                              status={getReportTaskStatus(session.endDatetime, session.hasReport)}
                              icon="report"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3 px-2">
          {sessions.map((session) => {
            const accent = projectColor(session.projectId);
            return (
              <div
                key={session.id}
                className="rounded-2xl border bg-white p-4"
                style={{ borderLeftWidth: 4, borderLeftColor: accent }}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <Link
                      href={`/sessions/${session.id}`}
                      className="text-base font-semibold hover:text-primary"
                    >
                      {formatDatetime(session.startDatetime)}
                    </Link>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {session.trainingTitle} · {session.programName}
                    </p>
                    <p className="text-[13px] font-medium" style={{ color: accent }}>
                      {session.projectName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SessionTaskButton
                      href={`/sessions/${session.id}#emargement`}
                      label="Gérer la présence"
                      status={getAttendanceTaskStatus(
                        session.endDatetime,
                        session.participants
                      )}
                      icon="attendance"
                    />
                    <SessionTaskButton
                      href={`/sessions/${session.id}#compte-rendu`}
                      label="Compte rendu"
                      status={getReportTaskStatus(session.endDatetime, session.hasReport)}
                      icon="report"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
