"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { ChevronRight, GripVertical } from "lucide-react";
import { LazyTrainingEditButton as TrainingEditButton } from "@/components/features/programs/lazy-modals";
import { TrainingCardTags } from "@/components/features/programs/training-card-tags";
import { LazyDeleteButton as DeleteButton } from "@/components/features/projects/lazy-modals";
import { cn } from "@/lib/utils";
import type { TrainingLifecycleStatus } from "@/lib/training-ui";

type Training = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  sessionCount: number;
  participantCount: number;
  documentCount: number;
  lifecycleStatus: TrainingLifecycleStatus;
};

type TrainingCardsProps = {
  programId: string;
  trainings: Training[];
  canEdit: boolean;
};

const ACCENTS = [
  "from-[#CD3465] to-[#a82855]",
  "from-[#3b82f6] to-[#1d4ed8]",
  "from-[#8b5cf6] to-[#6d28d9]",
  "from-[#10b981] to-[#047857]",
  "from-[#f59e0b] to-[#d97706]",
];

export function TrainingCards({ programId, trainings, canEdit }: TrainingCardsProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [items, setItems] = useState(trainings);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(trainings);
  }, [trainings]);

  async function persistOrder(nextItems: Training[]) {
    setSaving(true);
    await fetch(`/api/programs/${programId}/trainings/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainingIds: nextItems.map((t) => t.id) }),
    });
    setSaving(false);
    refreshCurrentPath();
  }

  function reorderBefore(fromId: string, beforeId: string) {
    if (fromId === beforeId) return;
    setItems((prev) => {
      const next = [...prev];
      const from = next.findIndex((t) => t.id === fromId);
      const before = next.findIndex((t) => t.id === beforeId);
      if (from < 0 || before < 0) return prev;
      const [moved] = next.splice(from, 1);
      const insertAt = from < before ? before - 1 : before;
      next.splice(insertAt, 0, moved);
      const reordered = next.map((t, index) => ({ ...t, orderIndex: index }));
      void persistOrder(reordered);
      return reordered;
    });
  }

  function handleDropOnCard(targetId: string) {
    if (!dragId || !canEdit || dragId === targetId) return;
    reorderBefore(dragId, targetId);
    setDragId(null);
    setDropTargetId(null);
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", saving && "opacity-70")}>
      {items.map((training, index) => (
        <div
          key={training.id}
          className={cn(
            "group relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
            dragId === training.id && "opacity-50",
            dropTargetId === training.id && "ring-2 ring-[#CD3465]/40"
          )}
          onDragOver={
            canEdit && dragId
              ? (e) => {
                  e.preventDefault();
                  setDropTargetId(training.id);
                }
              : undefined
          }
          onDragLeave={
            canEdit
              ? () => setDropTargetId((id) => (id === training.id ? null : id))
              : undefined
          }
          onDrop={
            canEdit
              ? (e) => {
                  e.preventDefault();
                  handleDropOnCard(training.id);
                }
              : undefined
          }
        >
          <div
            className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${ACCENTS[index % ACCENTS.length]}`}
          />
          <div className="relative p-6 pl-7">
            {canEdit && (
              <div className="absolute right-3 top-3 z-10 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragId(training.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setDropTargetId(null);
                  }}
                  className="cursor-grab rounded p-1.5 text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground active:cursor-grabbing"
                  title="Réordonner (déposer sur une autre formation)"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <TrainingEditButton programId={programId} training={training} />
                <DeleteButton url={`/api/programs/${programId}/trainings/${training.id}`} />
              </div>
            )}

            <Link href={`/trainings/${training.id}`} className="block min-w-0">
              <div className={cn("flex items-center gap-2", canEdit && "pr-16")}>
                <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                  {training.title}
                </h3>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </div>
              {training.description && (
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                  {training.description}
                </p>
              )}
              <TrainingCardTags
                participantCount={training.participantCount}
                documentCount={training.documentCount}
                sessionCount={training.sessionCount}
                lifecycleStatus={training.lifecycleStatus}
              />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
