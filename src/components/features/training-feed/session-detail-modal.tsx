"use client";

import {
  Calendar,
  Clock,
  GraduationCap,
  MapPin,
  Navigation,
  StickyNote,
} from "lucide-react";
import { SessionDisplayBadge } from "@/components/features/training-feed/session-status-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DISPLAY_STATUS_META,
  getSessionDisplayStatus,
  type SessionDisplayStatus,
} from "@/lib/session-display";
import { formatDate, formatTime } from "@/lib/format";
import type { FeedSessionRow } from "@/components/features/training-feed/feed-sessions-panel";

function formatTrainerNames(trainers: FeedSessionRow["trainers"]) {
  const names = trainers.map((t) => `${t.firstName} ${t.lastName}`);
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} et ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

type SessionDetailModalProps = {
  session: FeedSessionRow | null;
  staffView: boolean;
  nextSessionId?: string | null;
  onClose: () => void;
};

export function SessionDetailModal({
  session,
  staffView,
  nextSessionId,
  onClose,
}: SessionDetailModalProps) {
  const displayStatus: SessionDisplayStatus | null = session
    ? getSessionDisplayStatus(session, { staffView, nextSessionId })
    : null;
  const statusMeta = displayStatus ? DISPLAY_STATUS_META[displayStatus] : null;
  const trainerLine = session ? formatTrainerNames(session.trainers) : null;

  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {session && (
          <>
            <DialogHeader>
              <DialogTitle>Détail de la session</DialogTitle>
            </DialogHeader>

            {statusMeta && (
              <SessionDisplayBadge
                label={statusMeta.label}
                badgeClass={statusMeta.badge}
                icon={statusMeta.icon}
              />
            )}

            <dl className="mt-4 space-y-4 text-[13px]">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#CD3465]" />
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </dt>
                  <dd className="mt-0.5 font-medium">{formatDate(session.startDatetime)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#CD3465]" />
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Horaires
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {formatTime(session.startDatetime)} – {formatTime(session.endDatetime)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#CD3465]" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Lieu
                  </dt>
                  <dd className="mt-0.5 font-medium">{session.locationName || "—"}</dd>
                </div>
              </div>

              {session.address && (
                <div className="flex items-start gap-3">
                  <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-[#CD3465]" />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Adresse
                    </dt>
                    <dd className="mt-0.5 text-muted-foreground">{session.address}</dd>
                  </div>
                </div>
              )}

              {session.locationInstructions && (
                <div className="flex items-start gap-3">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-[#CD3465]" />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Instructions
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                      {session.locationInstructions}
                    </dd>
                  </div>
                </div>
              )}

              {trainerLine && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[#CD3465]" />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Formateurs
                    </dt>
                    <dd className="mt-0.5 font-medium">Animée par {trainerLine}</dd>
                  </div>
                </div>
              )}
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
