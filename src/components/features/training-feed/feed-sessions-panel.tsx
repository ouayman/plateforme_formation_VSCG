"use client";

import { useMemo, useState } from "react";
import { Calendar, GraduationCap, MapPin } from "lucide-react";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DISPLAY_STATUS_META,
  filterVisibleSessions,
  findNextConfirmedSessionId,
  getSessionDisplayStatus,
  getSessionRowClass,
  isSessionPastForAttendance,
} from "@/lib/session-display";
import { FeedSidebarSection } from "@/components/features/training-feed/feed-sidebar-section";
import { SessionDetailModal } from "@/components/features/training-feed/session-detail-modal";
import { SessionDisplayBadge } from "@/components/features/training-feed/session-status-ui";
import { TrainingSessionsManager } from "@/components/features/training-feed/training-sessions-manager";

export type FeedSessionTrainer = {
  firstName: string;
  lastName: string;
};

export type FeedSessionRow = {
  id: string;
  startDatetime: string;
  endDatetime: string;
  status: string;
  locationName: string | null;
  address: string | null;
  locationInstructions: string | null;
  attendanceStatus: "present" | "absent" | null;
  trainers: FeedSessionTrainer[];
};

type Trainer = { id: string; firstName: string; lastName: string };
type Location = { id: string; name: string };

type ProjectMeta = { companyName: string; projectName: string; programName: string };

type FeedSessionsPanelProps = {
  trainingId: string;
  sessions: FeedSessionRow[];
  showAttendance: boolean;
  staffView?: boolean;
  collapsible?: boolean;
  canManageSessions?: boolean;
  trainers?: Trainer[];
  locations?: Location[];
  trainingTitle?: string;
  projectMeta?: ProjectMeta;
};

function formatTrainerNames(trainers: FeedSessionTrainer[]) {
  const names = trainers.map((t) => `${t.firstName} ${t.lastName}`);
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} et ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

export function FeedSessionsPanel({
  trainingId,
  sessions,
  showAttendance,
  staffView = false,
  collapsible = false,
  canManageSessions = false,
  trainers = [],
  locations = [],
  trainingTitle = "",
  projectMeta = { companyName: "", projectName: "", programName: "" },
}: FeedSessionsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [detailSession, setDetailSession] = useState<FeedSessionRow | null>(null);

  const visibleSessions = useMemo(
    () => filterVisibleSessions(sessions, staffView),
    [sessions, staffView]
  );

  const nextSessionId = useMemo(
    () => findNextConfirmedSessionId(sessions),
    [sessions]
  );

  const displaySessions = staffView ? sessions : visibleSessions;
  const listSessions = expanded ? displaySessions : displaySessions.slice(0, 3);
  const showExpandControl = sessions.length > 3;

  return (
    <>
      <FeedSidebarSection
        icon={Calendar}
        title="Sessions"
        count={sessions.length}
        collapsible={collapsible}
        empty={{
          icon: Calendar,
          message: "Aucune session planifiée pour le moment.",
        }}
      >
        {visibleSessions.length > 0 && (
          <>
            <ul>
              {listSessions.map((session, i) => {
                const displayStatus = getSessionDisplayStatus(session, {
                  staffView,
                  nextSessionId,
                });
                const statusMeta = displayStatus ? DISPLAY_STATUS_META[displayStatus] : null;
                const rowClass = getSessionRowClass(session, { staffView, nextSessionId });
                const isPast = isSessionPastForAttendance(displayStatus, session.endDatetime);
                const trainerLine = formatTrainerNames(session.trainers);
                const attendanceLabel =
                  session.attendanceStatus === "present"
                    ? "Présent"
                    : session.attendanceStatus === "absent"
                      ? "Absent"
                      : "Non renseigné";

                return (
                  <li
                    key={session.id}
                    className={cn(i > 0 && "border-t border-surface")}
                  >
                    <button
                      type="button"
                      onClick={() => setDetailSession(session)}
                      className={cn(
                        "w-full px-4 py-3.5 text-left transition hover:brightness-[0.98] sm:px-5",
                        rowClass
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <p className="text-[13px] font-medium leading-snug">
                          {formatDate(session.startDatetime)}
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · {formatTime(session.startDatetime)} –{" "}
                            {formatTime(session.endDatetime)}
                          </span>
                        </p>
                        {statusMeta && (
                          <SessionDisplayBadge
                            label={statusMeta.label}
                            badgeClass={statusMeta.badge}
                            icon={statusMeta.icon}
                          />
                        )}
                      </div>
                      {(session.locationName || session.address) && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] leading-relaxed text-muted-foreground">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="min-w-0 flex-1">
                            {[session.locationName, session.address].filter(Boolean).join(" — ")}
                          </span>
                        </p>
                      )}
                      {trainerLine && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] leading-relaxed text-muted-foreground">
                          <GraduationCap className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="min-w-0 flex-1">Animée par {trainerLine}</span>
                        </p>
                      )}
                      {showAttendance && isPast && (
                        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                          Présence :{" "}
                          <span
                            className={cn(
                              session.attendanceStatus === "present" && "text-emerald-600",
                              session.attendanceStatus === "absent" && "text-red-600"
                            )}
                          >
                            {attendanceLabel}
                          </span>
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {!expanded && showExpandControl && (
              <div className="border-t border-surface px-4 py-2.5 sm:px-5">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="text-[12px] font-medium text-muted-foreground transition hover:text-[#CD3465]"
                >
                  Afficher les {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                </button>
              </div>
            )}
            {expanded && showExpandControl && (
              <div className="border-t border-surface px-4 py-2.5 sm:px-5">
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-[12px] font-medium text-muted-foreground transition hover:text-[#CD3465]"
                >
                  Réduire
                </button>
              </div>
            )}

            {canManageSessions && (
              <div className="border-t border-surface px-4 py-3 sm:px-5">
                <TrainingSessionsManager
                  trainingId={trainingId}
                  trainingTitle={trainingTitle}
                  projectMeta={projectMeta}
                  trainers={trainers}
                  locations={locations}
                />
              </div>
            )}
          </>
        )}

        {visibleSessions.length === 0 && canManageSessions && (
          <div className="border-t border-surface px-4 py-3 sm:px-5">
            <TrainingSessionsManager
              trainingId={trainingId}
              trainingTitle={trainingTitle}
              projectMeta={projectMeta}
              trainers={trainers}
              locations={locations}
            />
          </div>
        )}
      </FeedSidebarSection>

      <SessionDetailModal
        session={detailSession}
        staffView={staffView}
        nextSessionId={nextSessionId}
        onClose={() => setDetailSession(null)}
      />
    </>
  );
}
