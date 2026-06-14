"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { GraduationCap, MessageSquare, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionBlock } from "@/components/layout/section-block";
import { LazyTrainingFormModal as TrainingFormModal } from "@/components/features/programs/lazy-modals";
import { TrainingCards } from "@/components/features/programs/training-cards";
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
  canEditStructure: boolean;
  canManageParticipants: boolean;
  canViewAllFeedbacks: boolean;
  trainings: TrainingCardRow[];
  nextOrder: number;
  participantCount: number;
  feedbackCount: number;
  participantsPanel?: ReactNode;
  feedbacksPanel?: ReactNode;
};

export function ProgramDetailTabs({
  programId,
  canEditStructure,
  canManageParticipants,
  canViewAllFeedbacks,
  trainings,
  nextOrder,
  participantCount,
  feedbackCount,
  participantsPanel,
  feedbacksPanel,
}: ProgramDetailTabsProps) {
  const tabs: { value: string; label: string; icon: LucideIcon; count: number }[] = [
    { value: "trainings", label: "Formations", icon: GraduationCap, count: trainings.length },
  ];

  if (canManageParticipants || canViewAllFeedbacks) {
    tabs.push({
      value: "participants",
      label: "Participants",
      icon: Users,
      count: participantCount,
    });
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
            canEditStructure ? (
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
            <TrainingCards programId={programId} trainings={trainings} canEdit={canEditStructure} />
          )}
        </SectionBlock>
      </TabsContent>

      {(canManageParticipants || canViewAllFeedbacks) && (
        <TabsContent value="participants" className="mt-6">
          {participantsPanel}
        </TabsContent>
      )}

      {canViewAllFeedbacks && (
        <TabsContent value="feedbacks" className="mt-6">
          {feedbacksPanel}
        </TabsContent>
      )}
    </Tabs>
  );
}
