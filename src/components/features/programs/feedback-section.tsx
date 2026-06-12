"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Calendar, Check, ChevronDown, GraduationCap, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DropdownPortal } from "@/components/ui/dropdown-portal";
import { cn } from "@/lib/utils";
import { formatDatetime } from "@/lib/format";

type FeedbackItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  training?: { id: string; title: string };
};

type TrainingOption = { id: string; title: string };

type FeedbackSectionProps = {
  canViewAll: boolean;
  allFeedbacks: FeedbackItem[];
  trainings: TrainingOption[];
};

function StarRating({ value, readonly = true }: { value: number; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            readonly ? "cursor-default" : "cursor-pointer",
            star <= value ? "fill-amber-500 text-amber-500" : "text-muted-foreground/25"
          )}
        />
      ))}
    </div>
  );
}

function TrainingFilterDropdown({
  value,
  onChange,
  trainings,
}: {
  value: string;
  onChange: (value: string) => void;
  trainings: TrainingOption[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedLabel =
    value === "" ? "Toutes les formations" : trainings.find((t) => t.id === value)?.title ?? "Formation";

  const options = [{ id: "", title: "Toutes les formations" }, ...trainings];

  return (
    <div className="w-full min-w-[20rem] max-w-xl">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-9 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-[13px] transition",
          "hover:border-[#CD3465]/30 hover:bg-muted/30",
          open && "border-[#CD3465]/40 ring-2 ring-[#CD3465]/10"
        )}
      >
        <GraduationCap className="h-4 w-4 shrink-0 text-[#CD3465]" />
        <span className="min-w-0 flex-1 whitespace-normal leading-snug">{selectedLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <DropdownPortal
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        matchWidth
        className="overflow-hidden rounded-lg border border-border/80 bg-background shadow-lg"
      >
        <ul className="max-h-56 overflow-y-auto py-1">
          {options.map((option) => {
            const selected = value === option.id;
            return (
              <li key={option.id || "all"}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2.5 text-left text-[13px] transition hover:bg-muted/50",
                    selected && "bg-[#CD3465]/5 font-medium text-[#CD3465]"
                  )}
                >
                  <Check
                    className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")}
                  />
                  <span className="min-w-0 flex-1 whitespace-normal leading-snug">{option.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </DropdownPortal>
    </div>
  );
}

function RatingFilterStars({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Filtrer ${star} étoile${star > 1 ? "s" : ""}`}
          onClick={() => onChange(value === star ? null : star)}
          className={cn(
            "rounded p-0.5 transition hover:scale-110",
            value !== null && star <= value ? "text-amber-500" : "text-muted-foreground/30",
            value === star && "ring-2 ring-amber-500/30"
          )}
        >
          <Star className={cn("h-5 w-5", value !== null && star <= value && "fill-current")} />
        </button>
      ))}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-[11px] font-medium text-muted-foreground transition hover:text-[#CD3465]"
        >
          Toutes
        </button>
      )}
    </div>
  );
}

export function FeedbackSection({
  canViewAll,
  allFeedbacks,
  trainings,
}: FeedbackSectionProps) {
  const [trainingFilter, setTrainingFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const consolidatedRating = useMemo(() => {
    if (allFeedbacks.length === 0) return null;
    const sum = allFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    return Math.round((sum / allFeedbacks.length) * 10) / 10;
  }, [allFeedbacks]);

  const filtered = useMemo(() => {
    return allFeedbacks.filter((f) => {
      if (trainingFilter && f.training?.id !== trainingFilter) return false;
      if (ratingFilter !== null && f.rating !== ratingFilter) return false;
      return true;
    });
  }, [allFeedbacks, trainingFilter, ratingFilter]);

  if (!canViewAll) {
    return (
      <EmptyState
        icon={Star}
        title="Avis non disponibles"
        description="Consultez le feed de chaque formation pour laisser votre avis après une session."
      />
    );
  }

  return (
    <div className="space-y-5 px-4 pb-2 pt-3">
      {consolidatedRating !== null && (
        <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 px-5 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#CD3465]/10 text-xl font-bold text-[#CD3465]">
            {consolidatedRating.toFixed(1)}
          </div>
          <div>
            <p className="text-sm font-semibold">Note consolidée du programme</p>
            <p className="text-[13px] text-muted-foreground">
              Moyenne sur {allFeedbacks.length} avis · sur 5
            </p>
            <StarRating value={Math.round(consolidatedRating)} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-6">
        <div className="w-full space-y-1.5 sm:min-w-[20rem] sm:max-w-xl">
          <label className="text-[11px] font-medium text-muted-foreground">Formation</label>
          <TrainingFilterDropdown
            value={trainingFilter}
            onChange={setTrainingFilter}
            trainings={trainings}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Note</label>
          <RatingFilterStars value={ratingFilter} onChange={setRatingFilter} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucun avis"
          description={
            allFeedbacks.length === 0
              ? "Les participants n'ont pas encore laissé d'avis."
              : "Aucun avis ne correspond aux filtres sélectionnés."
          }
        />
      ) : (
        <table className="modern-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Formation</th>
              <th>Note</th>
              <th>Commentaire</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td className="font-medium">
                  {f.user.firstName} {f.user.lastName}
                  <p className="text-[12px] font-normal text-muted-foreground">{f.user.email}</p>
                </td>
                <td>
                  {f.training ? (
                    <Link
                      href={`/trainings/${f.training.id}`}
                      className="text-[13px] font-medium text-[#CD3465] hover:underline"
                    >
                      {f.training.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <StarRating value={f.rating} />
                </td>
                <td className="max-w-xs text-muted-foreground">{f.comment || "—"}</td>
                <td className="text-muted-foreground">{formatDatetime(f.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
