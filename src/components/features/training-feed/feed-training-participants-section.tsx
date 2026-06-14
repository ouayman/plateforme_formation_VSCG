"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { FeedParticipantsAdminPanel } from "@/components/features/training-feed/feed-certificate-panel";
import { FeedSidebarSection } from "@/components/features/training-feed/feed-sidebar-section";
import { useTrainingFeed } from "@/components/features/training-feed/training-feed-context";
import { Users } from "lucide-react";
type FeedTrainingParticipantsSectionProps = {
  trainingId: string;
  canManage: boolean;
  collapsible?: boolean;
};

export function FeedTrainingParticipantsSection({
  trainingId,
  canManage,
  collapsible = false,
}: FeedTrainingParticipantsSectionProps) {
  const {
    certificates,
    availableParticipants,
    assignParticipant,
    unassignParticipant,
  } = useTrainingFeed();
  const [pending, setPending] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  async function assign(userId: string) {
    const user = availableParticipants.find((p) => p.id === userId);
    if (!user) return;

    setPending(userId);
    const optimisticCertificate = {
      userId: user.id,
      status: "locked" as const,
      attendancePercent: null,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
    assignParticipant(user, optimisticCertificate);

    const res = await fetch(`/api/trainings/${trainingId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    setPending(null);
    setSelectedUserId("");

    if (!res.ok) {
      unassignParticipant(userId);
    }
  }

  async function unassign(userId: string) {
    if (!confirm("Retirer ce participant de la formation ? Il n'aura plus accès au feed.")) {
      return;
    }

    const snapshot = certificates.find((c) => c.userId === userId);
    setPending(`rm:${userId}`);
    unassignParticipant(userId);

    const res = await fetch(`/api/trainings/${trainingId}/participants?userId=${userId}`, {
      method: "DELETE",
    });

    setPending(null);

    if (!res.ok && snapshot) {
      assignParticipant(
        {
          id: snapshot.userId,
          firstName: snapshot.user.firstName,
          lastName: snapshot.user.lastName,
          email: snapshot.user.email,
        },
        snapshot
      );
    }
  }

  return (
    <>
      <FeedParticipantsAdminPanel
        trainingId={trainingId}
        collapsible={collapsible}
        onUnassign={canManage ? unassign : undefined}
        unassignPending={pending}
      />

      {canManage && availableParticipants.length > 0 && (
        <FeedSidebarSection icon={Users} title="Ajouter au parcours">
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <p className="text-[12px] text-muted-foreground">
              Participants du programme non encore affectés à cette formation.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-[13px]"
              >
                <option value="">— Sélectionner —</option>
                {availableParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedUserId || pending === selectedUserId}
                onClick={() => selectedUserId && assign(selectedUserId)}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#CD3465] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#b82d58] disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                Affecter
              </button>
            </div>
          </div>
        </FeedSidebarSection>
      )}

    </>
  );
}
