import { Users } from "lucide-react";
import { loadProgramParticipantsData } from "@/lib/loaders/program-detail";
import { SectionBlock } from "@/components/layout/section-block";
import { AddParticipantModal } from "@/components/features/programs/add-participant-modal";
import { ProgramParticipantsTable } from "@/components/features/programs/program-participants-table";
import { EmptyState } from "@/components/ui/empty-state";
import { countLabel } from "@/lib/format";

type ProgramParticipantsPanelProps = {
  programId: string;
  canManageParticipants: boolean;
  trainingOptions: { id: string; title: string; orderIndex: number }[];
};

export async function ProgramParticipantsPanel({
  programId,
  canManageParticipants,
  trainingOptions,
}: ProgramParticipantsPanelProps) {
  const participants = await loadProgramParticipantsData(programId);

  return (
    <SectionBlock
      title="Participants"
      countLabel={countLabel(participants.length, "participant", "participants")}
      action={
        canManageParticipants ? (
          <AddParticipantModal programId={programId} trainings={trainingOptions} />
        ) : undefined
      }
    >
      {participants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun participant"
          description="Inscrivez les participants au programme."
        />
      ) : (
        <ProgramParticipantsTable
          programId={programId}
          participants={participants}
          allTrainings={trainingOptions}
          canManage={canManageParticipants}
        />
      )}
    </SectionBlock>
  );
}
