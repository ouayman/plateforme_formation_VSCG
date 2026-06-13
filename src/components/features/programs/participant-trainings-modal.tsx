"use client";

import { useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { GraduationCap, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatTrainingCount } from "@/lib/training-ui";

type TrainingOption = { id: string; title: string; orderIndex: number };

type ParticipantTrainingsModalProps = {
  programId: string;
  participantName: string;
  userId: string;
  assignedTrainings: { id: string; title: string }[];
  allTrainings: TrainingOption[];
  canManage: boolean;
  trigger: React.ReactNode;
};

export function ParticipantTrainingsModal({
  programId,
  participantName,
  userId,
  assignedTrainings,
  allTrainings,
  canManage,
  trigger,
}: ParticipantTrainingsModalProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const assignedIds = new Set(assignedTrainings.map((t) => t.id));
  const missingTrainings = allTrainings.filter((t) => !assignedIds.has(t.id));

  async function assignTraining(trainingId: string) {
    setPending(`add:${trainingId}`);
    await fetch(`/api/programs/${programId}/participants/${userId}/trainings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainingId }),
    });
    setPending(null);
    refreshCurrentPath();
  }

  async function unassignTraining(trainingId: string) {
    setPending(`rm:${trainingId}`);
    await fetch(
      `/api/programs/${programId}/participants/${userId}/trainings?trainingId=${trainingId}`,
      { method: "DELETE" }
    );
    setPending(null);
    refreshCurrentPath();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center">
        {trigger}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Formations — {participantName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">
              {formatTrainingCount(assignedTrainings.length)} assignée
              {assignedTrainings.length !== 1 ? "s" : ""}
            </p>
            {assignedTrainings.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-center text-[13px] text-muted-foreground">
                Aucune formation assignée.
              </p>
            ) : (
              <ul className="space-y-2">
                {assignedTrainings.map((training) => (
                  <li
                    key={training.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-muted/10 px-3 py-2"
                  >
                    <span className="text-[13px] font-medium">{training.title}</span>
                    {canManage && (
                      <button
                        type="button"
                        title="Retirer de cette formation"
                        disabled={pending === `rm:${training.id}`}
                        onClick={() => unassignTraining(training.id)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canManage && missingTrainings.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Ajouter une formation
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingTrainings.map((training) => (
                    <button
                      key={training.id}
                      type="button"
                      disabled={pending === `add:${training.id}`}
                      onClick={() => assignTraining(training.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border border-dashed border-black/15 px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition hover:border-[#CD3465]/40 hover:text-[#CD3465]"
                      )}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {training.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ParticipantTrainingsCell({
  programId,
  participantName,
  userId,
  assignedTrainings,
  allTrainings,
  canManage,
}: Omit<ParticipantTrainingsModalProps, "trigger">) {
  return (
    <ParticipantTrainingsModal
      programId={programId}
      participantName={participantName}
      userId={userId}
      assignedTrainings={assignedTrainings}
      allTrainings={allTrainings}
      canManage={canManage}
      trigger={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-black/[0.04] px-2.5 py-1 text-[12px] font-medium text-foreground transition hover:bg-[#CD3465]/10 hover:text-[#CD3465]">
          <GraduationCap className="h-3.5 w-3.5" />
          {assignedTrainings.length} formation{assignedTrainings.length !== 1 ? "s" : ""}
        </span>
      }
    />
  );
}
