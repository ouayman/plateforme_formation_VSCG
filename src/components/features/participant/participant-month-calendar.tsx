"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDatetime } from "@/lib/format";
import { participantRoutes } from "@/lib/routes";
import { toDateKey } from "@/lib/calendar-week";
import {
  addMonths,
  formatMonthYear,
  getMonthGrid,
  isSameDay,
  startOfMonth,
  WEEKDAY_LABELS,
} from "@/lib/calendar-month";
import { projectColor } from "@/lib/session-tasks";

export type ParticipantCalendarSession = {
  id: string;
  trainingId: string;
  trainingTitle: string;
  programName: string;
  projectId: string;
  startDatetime: string;
  endDatetime: string;
  locationName: string | null;
};

type ParticipantMonthCalendarProps = {
  sessions: ParticipantCalendarSession[];
};

export function ParticipantMonthCalendar({ sessions }: ParticipantMonthCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date());

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, ParticipantCalendarSession[]>();
    for (const session of sessions) {
      const key = toDateKey(session.startDatetime);
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    Array.from(map.keys()).forEach((key) => {
      const list = map.get(key)!;
      list.sort(
        (a: ParticipantCalendarSession, b: ParticipantCalendarSession) =>
          new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
      );
    });
    return map;
  }, [sessions]);

  const grid = useMemo(() => getMonthGrid(month), [month]);
  const today = new Date();
  const selectedSessions = selectedDay
    ? (sessionsByDay.get(toDateKey(selectedDay)) ?? [])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMonth(startOfMonth(new Date()));
              setSelectedDay(new Date());
            }}
            className="ml-2 text-[12px] font-medium text-[#CD3465] hover:underline"
          >
            Aujourd&apos;hui
          </button>
        </div>
        <p className="text-[15px] font-semibold capitalize">{formatMonthYear(month)}</p>
      </div>

      <div>
        <div className="mb-1 grid grid-cols-7">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-[11px] font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px rounded-xl bg-border/30 p-px">
          {grid.map(({ date, inMonth }) => {
            const key = toDateKey(date);
            const daySessions = sessionsByDay.get(key) ?? [];
            const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
            const isToday = isSameDay(date, today);
            const hasSessions = daySessions.length > 0 && inMonth;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(new Date(date))}
                className={cn(
                  "min-h-[72px] bg-white p-1.5 text-left transition sm:min-h-[80px]",
                  !inMonth && "bg-[#fafafa] text-muted-foreground/30",
                  isSelected && "bg-[#CD3465]/[0.04] ring-1 ring-[#CD3465]/30 ring-inset",
                  inMonth && !isSelected && "hover:bg-black/[0.02]"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px]",
                    isToday && inMonth && "bg-[#0F172A] font-medium text-white",
                    !isToday && inMonth && "text-foreground/75"
                  )}
                >
                  {date.getDate()}
                </span>

                {hasSessions && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {daySessions.slice(0, 3).map((session) => (
                      <span
                        key={session.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: projectColor(session.projectId) }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border/50 pt-5">
        <p className="text-[13px] font-medium capitalize text-foreground">
          {selectedDay?.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>

        {selectedSessions.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">Aucune session.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {selectedSessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={participantRoutes.training(session.trainingId)}
                  className="group flex items-center gap-3 rounded-lg py-2 transition hover:bg-black/[0.02]"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: projectColor(session.projectId) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{session.trainingTitle}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {formatDatetime(session.startDatetime)}
                      {session.locationName ? ` · ${session.locationName}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
