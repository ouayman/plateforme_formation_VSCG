"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus } from "lucide-react";
import { FeedParticipantsAdminPanel } from "@/components/features/training-feed/feed-certificate-panel";
import { FeedSidebarSection } from "@/components/features/training-feed/feed-sidebar-section";
import { Users } from "lucide-react";

type ParticipantUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type CertificateRow = {
  userId: string;
  status: "locked" | "unlocked";
  attendancePercent: number | null;
  user: { firstName: string; lastName: string; email: string };
};

type FeedTrainingParticipantsSectionProps = {
  trainingId: string;
  certificates: CertificateRow[];
  availableParticipants: ParticipantUser[];
  canManage: boolean;
  collapsible?: boolean;
};

export function FeedTrainingParticipantsSection({
  trainingId,
  certificates,
  availableParticipants,
  canManage,
  collapsible = false,
}: FeedTrainingParticipantsSectionProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  async function assign(userId: string) {
    setPending(userId);
    await fetch(`/api/trainings/${trainingId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setPending(null);
    setSelectedUserId("");
    router.refresh();
  }

  async function unassign(userId: string) {
    if (!confirm("Retirer ce participant de la formation ? Il n'aura plus accès au feed.")) {
      return;
    }
    setPending(`rm:${userId}`);
    await fetch(`/api/trainings/${trainingId}/participants?userId=${userId}`, {
      method: "DELETE",
    });
    setPending(null);
    router.refresh();
  }

  return (
    <>
      <FeedParticipantsAdminPanel
        trainingId={trainingId}
        certificates={certificates}
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

      {canManage && certificates.length === 0 && availableParticipants.length === 0 && (
        <FeedSidebarSection
          icon={UserMinus}
          title="Référentiel programme"
          empty={{
            icon: Users,
            message:
              "Aucun participant dans le programme.\nAjoutez des participants depuis la fiche programme.",
          }}
        />
      )}
    </>
  );
}
