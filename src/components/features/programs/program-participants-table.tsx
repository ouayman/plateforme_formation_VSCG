"use client";

import { AlertTriangle, Mail } from "lucide-react";
import { LazyDeleteButton as DeleteButton } from "@/components/features/projects/lazy-modals";
import { ParticipantTrainingsCell } from "@/components/features/programs/participant-trainings-modal";

type TrainingOption = { id: string; title: string; orderIndex: number };

type ParticipantRow = {
  id: string;
  userId: string;
  user: { firstName: string; lastName: string; email: string };
  trainings: { id: string; title: string }[];
};

type ProgramParticipantsTableProps = {
  programId: string;
  participants: ParticipantRow[];
  allTrainings: TrainingOption[];
  canManage: boolean;
};

export function ProgramParticipantsTable({
  programId,
  participants,
  allTrainings,
  canManage,
}: ProgramParticipantsTableProps) {
  return (
    <table className="modern-table">
      <thead>
        <tr>
          <th>Participant</th>
          <th>Email</th>
          <th>Formations</th>
          {canManage && <th className="w-16" />}
        </tr>
      </thead>
      <tbody>
        {participants.map((p) => {
          const hasNoTraining = p.trainings.length === 0;
          const participantName = `${p.user.firstName} ${p.user.lastName}`;

          return (
            <tr key={p.id}>
              <td>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-700">
                      {p.user.firstName[0]}
                      {p.user.lastName[0]}
                    </div>
                    <span className="font-medium">{participantName}</span>
                  </div>
                  {hasNoTraining && (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Participant affecté à aucune formation
                    </span>
                  )}
                </div>
              </td>
              <td>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {p.user.email}
                </span>
              </td>
              <td>
                <ParticipantTrainingsCell
                  programId={programId}
                  participantName={participantName}
                  userId={p.userId}
                  assignedTrainings={p.trainings}
                  allTrainings={allTrainings}
                  canManage={canManage}
                />
              </td>
              {canManage && (
                <td>
                  <DeleteButton url={`/api/programs/${programId}/participants/${p.userId}`} />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
