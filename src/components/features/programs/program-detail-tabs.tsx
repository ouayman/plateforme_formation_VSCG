"use client";

import type { LucideIcon } from "lucide-react";
import { GraduationCap, MessageSquare, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionBlock } from "@/components/layout/section-block";
import { TrainingFormModal } from "@/components/features/programs/training-form-modal";
import { TrainingCards } from "@/components/features/programs/training-cards";
import { AddParticipantModal } from "@/components/features/programs/add-participant-modal";
import { ProgramParticipantsTable } from "@/components/features/programs/program-participants-table";
import { FeedbackSection } from "@/components/features/programs/feedback-section";
import { EmptyState } from "@/components/ui/empty-state";
import { countLabel } from "@/lib/format";
import type { TrainingLifecycleStatus } from "@/lib/training-ui";

type TrainingCardRow = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  sessionCount: number;
  participantCount: number;
  documentCount: number;
  lifecycleStatus: TrainingLifecycleStatus;
};

type ProgramDetailTabsProps = {
  programId: string;
  canEditStaff: boolean;
  canManageParticipants: boolean;
  canViewAllFeedbacks: boolean;
  trainings: TrainingCardRow[];
  participants: {
    id: string;
    userId: string;
    user: { firstName: string; lastName: string; email: string };
    trainings: { id: string; title: string }[];
  }[];
  nextOrder: number;
  allFeedbacks: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { firstName: string; lastName: string; email: string };
    training?: { id: string; title: string };
  }[];
  feedbackTrainingOptions: { id: string; title: string; orderIndex: number }[];
};

export function ProgramDetailTabs({
  programId,
  canEditStaff,
  canManageParticipants,
  canViewAllFeedbacks,
  trainings,
  participants,
  nextOrder,
  allFeedbacks,
  feedbackTrainingOptions,
}: ProgramDetailTabsProps) {
  const feedbackCount = allFeedbacks.length;
  const trainingOptions = trainings.map((t) => ({
    id: t.id,
    title: t.title,
    orderIndex: t.orderIndex,
  }));

  const tabs: { value: string; label: string; icon: LucideIcon; count: number }[] = [
    { value: "trainings", label: "Formations", icon: GraduationCap, count: trainings.length },
  ];

  if (canManageParticipants || canViewAllFeedbacks) {
    tabs.push({ value: "participants", label: "Participants", icon: Users, count: participants.length });
  }
  if (canViewAllFeedbacks) {
    tabs.push({
      value: "feedbacks",
      label: "Avis des participants",
      icon: MessageSquare,
      count: feedbackCount,
    });
  }

  return (
    <Tabs defaultValue="trainings" className="w-full">
      <TabsList>
        {tabs.map(({ value, label, icon: Icon, count }) => (
          <TabsTrigger key={value} value={value} className="group">
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold group-data-[state=active]:bg-white/20">
                {count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="trainings" className="mt-6">
        <SectionBlock
          title="Formations"
          variant="plain"
          countLabel={countLabel(trainings.length, "formation", "formations")}
          action={
            canEditStaff ? (
              <TrainingFormModal programId={programId} nextOrderIndex={nextOrder} />
            ) : undefined
          }
        >
          {trainings.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Aucune formation"
              description="Ajoutez les modules de formation."
            />
          ) : (
            <TrainingCards programId={programId} trainings={trainings} canEdit={canEditStaff} />
          )}
        </SectionBlock>
      </TabsContent>

      {(canManageParticipants || canViewAllFeedbacks) && (
        <TabsContent value="participants" className="mt-6">
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
        </TabsContent>
      )}

      {canViewAllFeedbacks && (
        <TabsContent value="feedbacks" className="mt-6">
          <SectionBlock
            title="Avis des participants"
            countLabel={countLabel(feedbackCount, "avis", "avis")}
          >
            <FeedbackSection
              canViewAll={canViewAllFeedbacks}
              allFeedbacks={allFeedbacks}
              trainings={feedbackTrainingOptions}
            />
          </SectionBlock>
        </TabsContent>
      )}
    </Tabs>
  );
}
