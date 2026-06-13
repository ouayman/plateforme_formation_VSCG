"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { ChevronRight, GripVertical } from "lucide-react";
import { TrainingEditButton } from "@/components/features/programs/training-form-modal";
import { TrainingCardTags } from "@/components/features/programs/training-card-tags";
import { DeleteButton } from "@/components/features/projects/delete-button";
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

function DropIndicator({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none mx-1 transition-all duration-150",
        active ? "h-2 py-0.5 opacity-100" : "h-0 opacity-0"
      )}
      aria-hidden
    >
      <div className="h-0.5 rounded-full bg-[#CD3465]" />
    </div>
  );
}

export function TrainingCards({ programId, trainings, canEdit }: TrainingCardsProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [items, setItems] = useState(trainings);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
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

  function reorderAt(fromId: string, targetIndex: number) {
    setItems((prev) => {
      const next = [...prev];
      const from = next.findIndex((t) => t.id === fromId);
      if (from < 0) return prev;
      const [moved] = next.splice(from, 1);
      const insertAt = from < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(insertAt, 0, moved);
      const reordered = next.map((t, index) => ({ ...t, orderIndex: index }));
      void persistOrder(reordered);
      return reordered;
    });
  }

  function handleDropAt(index: number) {
    if (!dragId || !canEdit) return;
    reorderAt(dragId, index);
    setDragId(null);
    setDropIndex(null);
  }

  function handleDragOverSlot(e: React.DragEvent, index: number) {
    if (!canEdit || !dragId) return;
    e.preventDefault();
    setDropIndex(index);
  }

  return (
    <div className={cn("grid gap-0", saving && "opacity-70")}>
      {items.map((training, index) => (
        <div key={training.id}>
          {canEdit && (
            <div
              className="h-3"
              onDragOver={(e) => handleDragOverSlot(e, index)}
              onDragLeave={() => setDropIndex((v) => (v === index ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                handleDropAt(index);
              }}
            >
              <DropIndicator active={dropIndex === index} />
            </div>
          )}

          <div
            className={cn(
              "group relative overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_18px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)]",
              dragId === training.id && "opacity-50"
            )}
          >
            <div className="relative flex items-start gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {training.orderIndex + 1}
              </div>
              <Link href={`/trainings/${training.id}`} className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="truncate text-[15px] font-bold leading-snug transition-colors group-hover:text-primary">
                    {training.title}
                  </h3>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
                </div>
                {training.description && (
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
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
              {canEdit && (
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDragId(training.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropIndex(null);
                    }}
                    className="cursor-grab rounded p-1.5 text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground active:cursor-grabbing"
                    title="Réordonner"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <TrainingEditButton programId={programId} training={training} />
                  <DeleteButton url={`/api/programs/${programId}/trainings/${training.id}`} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {canEdit && items.length > 0 && (
        <div
          className="h-3"
          onDragOver={(e) => handleDragOverSlot(e, items.length)}
          onDragLeave={() => setDropIndex((v) => (v === items.length ? null : v))}
          onDrop={(e) => {
            e.preventDefault();
            handleDropAt(items.length);
          }}
        >
          <DropIndicator active={dropIndex === items.length} />
        </div>
      )}
    </div>
  );
}
