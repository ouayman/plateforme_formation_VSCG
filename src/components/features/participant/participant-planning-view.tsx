"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, MapPin } from "lucide-react";
import { formatDate } from "@/lib/format";
import { participantRoutes } from "@/lib/routes";
import { projectColor } from "@/lib/session-tasks";
import {
  ParticipantCalendarSession,
  ParticipantMonthCalendar,
} from "@/components/features/participant/participant-month-calendar";

type ParticipantPlanningViewProps = {
  firstName: string;
  sessions: ParticipantCalendarSession[];
  upcomingSessions: ParticipantCalendarSession[];
};

export function ParticipantPlanningView({
  firstName,
  sessions,
  upcomingSessions,
}: ParticipantPlanningViewProps) {
  return (
    <div className="mx-auto max-w-5xl pb-10">
      <header className="mb-8">
        <p className="text-[13px] font-medium text-[#CD3465]">Planning</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Calendrier de formation</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          {firstName} · {upcomingSessions.length} session
          {upcomingSessions.length !== 1 ? "s" : ""} à venir
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <ParticipantMonthCalendar sessions={sessions} />

        <aside>
          <h2 className="mb-4 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            À venir
          </h2>

          {upcomingSessions.length === 0 ? (
            <p className="text-[14px] text-muted-foreground">Aucune session planifiée.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {upcomingSessions.slice(0, 6).map((session) => (
                <li key={session.id}>
                  <Link
                    href={participantRoutes.training(session.trainingId)}
                    className="group flex gap-3 py-4 transition hover:opacity-80"
                  >
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold text-white"
                      style={{ backgroundColor: projectColor(session.projectId) }}
                    >
                      {new Date(session.startDatetime).getDate()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{session.trainingTitle}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(session.startDatetime)}
                      </p>
                      {session.locationName && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {session.locationName}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/30" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
