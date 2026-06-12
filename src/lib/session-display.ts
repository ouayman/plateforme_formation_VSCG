import { SessionStatus } from "@prisma/client";
import {
  Ban,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  CircleDashed,
  CircleDot,
  type LucideIcon,
} from "lucide-react";

export type SessionTimelineStatus = "upcoming" | "next_session" | "in_progress" | "completed";

export type SessionDisplayStatus = SessionTimelineStatus | "pending_confirmation" | "cancelled";

export const FUNCTIONAL_STATUSES = ["confirmed", "pending", "cancelled"] as const;
export type FunctionalSessionStatus = (typeof FUNCTIONAL_STATUSES)[number];

export const CREATION_STATUSES = ["confirmed", "pending"] as const;

type SessionLike = {
  id: string;
  status: SessionStatus | string;
  startDatetime: Date | string;
  endDatetime: Date | string;
};

export function isSessionVisibleToParticipant(status: SessionStatus | string) {
  return status === SessionStatus.confirmed;
}

export function deriveTimelineStatus(
  session: Pick<SessionLike, "id" | "startDatetime" | "endDatetime">,
  nextSessionId?: string | null
): SessionTimelineStatus {
  const now = Date.now();
  const start = new Date(session.startDatetime).getTime();
  const end = new Date(session.endDatetime).getTime();

  if (end <= now) return "completed";
  if (start <= now && now < end) return "in_progress";
  if (nextSessionId && session.id === nextSessionId) return "next_session";
  return "upcoming";
}

export function getSessionDisplayStatus(
  session: SessionLike,
  options: { staffView: boolean; nextSessionId?: string | null }
): SessionDisplayStatus | null {
  if (session.status === SessionStatus.pending) {
    return options.staffView ? "pending_confirmation" : null;
  }
  if (session.status === SessionStatus.cancelled) {
    return options.staffView ? "cancelled" : null;
  }
  if (session.status !== SessionStatus.confirmed) return null;
  return deriveTimelineStatus(session, options.nextSessionId);
}

export function filterVisibleSessions<T extends SessionLike>(
  sessions: T[],
  staffView: boolean
): T[] {
  if (staffView) return sessions;
  return sessions.filter((s) => isSessionVisibleToParticipant(s.status));
}

export function findNextConfirmedSessionId(sessions: SessionLike[]) {
  const now = Date.now();
  const upcoming = sessions
    .filter(
      (s) =>
        s.status === SessionStatus.confirmed &&
        new Date(s.endDatetime).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
    );
  return upcoming[0]?.id ?? null;
}

export const DISPLAY_STATUS_META: Record<
  SessionDisplayStatus,
  { label: string; badge: string; rowClass: string; icon: LucideIcon }
> = {
  upcoming: {
    label: "À venir",
    badge: "border-blue-200/80 bg-blue-50 text-blue-700",
    rowClass: "bg-blue-100",
    icon: CalendarDays,
  },
  next_session: {
    label: "Prochaine session",
    badge: "border-sky-200/80 bg-sky-50 text-sky-800",
    rowClass: "bg-sky-100",
    icon: CalendarClock,
  },
  in_progress: {
    label: "En cours",
    badge: "border-amber-200/80 bg-amber-50 text-amber-800",
    rowClass: "bg-amber-100",
    icon: CircleDot,
  },
  completed: {
    label: "Terminée",
    badge: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    rowClass: "bg-emerald-100",
    icon: CircleCheck,
  },
  pending_confirmation: {
    label: "À confirmer",
    badge: "border-orange-500 bg-orange-200 text-orange-950",
    rowClass: "bg-orange-100",
    icon: CircleDashed,
  },
  cancelled: {
    label: "Annulée",
    badge: "border-red-200/80 bg-red-50 text-red-700",
    rowClass: "bg-red-100",
    icon: Ban,
  },
};

export const FUNCTIONAL_STATUS_META: Record<
  FunctionalSessionStatus,
  { label: string; badge: string; activeBadge: string; icon: LucideIcon }
> = {
  confirmed: {
    label: "Confirmée",
    badge: "border-border/60 bg-muted/30 text-muted-foreground",
    activeBadge: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    icon: CircleCheck,
  },
  pending: {
    label: "À confirmer",
    badge: "border-orange-400 bg-orange-200 text-orange-950",
    activeBadge: "border-orange-500 bg-orange-300 text-orange-950",
    icon: CircleDashed,
  },
  cancelled: {
    label: "Annulée",
    badge: "border-border/60 bg-muted/30 text-muted-foreground",
    activeBadge: "border-red-200/80 bg-red-50 text-red-700",
    icon: Ban,
  },
};

export function getSessionRowClass(
  session: SessionLike,
  options: { staffView: boolean; nextSessionId?: string | null }
): string {
  if (session.status === SessionStatus.pending || session.status === "pending") {
    return DISPLAY_STATUS_META.pending_confirmation.rowClass;
  }
  if (session.status === SessionStatus.cancelled || session.status === "cancelled") {
    return DISPLAY_STATUS_META.cancelled.rowClass;
  }
  const display = getSessionDisplayStatus(session, options);
  return display ? DISPLAY_STATUS_META[display].rowClass : "bg-white";
}

export function isSessionPastForAttendance(
  status: SessionDisplayStatus | null,
  endDatetime: Date | string
) {
  if (status === "completed") return true;
  return new Date(endDatetime).getTime() < Date.now();
}

export function isTrainingSessionsComplete(
  sessions: { status: SessionStatus | string; endDatetime: Date | string }[]
) {
  const active = sessions.filter((s) => s.status === SessionStatus.confirmed);
  if (active.length === 0) return false;
  const now = Date.now();
  return active.every((s) => new Date(s.endDatetime).getTime() <= now);
}
