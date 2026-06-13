import { loadProgramFeedbacksData } from "@/lib/loaders/program-detail";
import { SectionBlock } from "@/components/layout/section-block";
import { FeedbackSection } from "@/components/features/programs/feedback-section";
import { countLabel } from "@/lib/format";

type ProgramFeedbacksPanelProps = {
  programId: string;
  canViewAllFeedbacks: boolean;
};

export async function ProgramFeedbacksPanel({
  programId,
  canViewAllFeedbacks,
}: ProgramFeedbacksPanelProps) {
  const programFeedbacks = await loadProgramFeedbacksData(programId);

  const feedbackTrainingOptions = Array.from(
    new Map(
      programFeedbacks
        .filter((f) => f.training)
        .map((f) => [f.training!.id, { id: f.training!.id, title: f.training!.title, orderIndex: 0 }])
    ).values()
  );

  return (
    <SectionBlock
      title="Avis des participants"
      countLabel={countLabel(programFeedbacks.length, "avis", "avis")}
    >
      <FeedbackSection
        canViewAll={canViewAllFeedbacks}
        allFeedbacks={programFeedbacks.map((f) => ({
          id: f.id,
          rating: f.rating,
          comment: f.comment,
          createdAt: f.createdAt.toISOString(),
          user: f.user,
          training: f.training,
        }))}
        trainings={feedbackTrainingOptions}
      />
    </SectionBlock>
  );
}
