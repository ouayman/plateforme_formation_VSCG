"use client";

import { MessageSquareHeart, Star } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FeedSidebarSection } from "@/components/features/training-feed/feed-sidebar-section";

export type TrainingFeedbackRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
};

type FeedFeedbackListPanelProps = {
  feedbacks: TrainingFeedbackRow[];
  collapsible?: boolean;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/25"
          )}
        />
      ))}
    </div>
  );
}

export function FeedFeedbackListPanel({ feedbacks, collapsible = false }: FeedFeedbackListPanelProps) {
  return (
    <FeedSidebarSection
      icon={MessageSquareHeart}
      title="Avis sur la formation"
      count={feedbacks.length}
      collapsible={collapsible}
      empty={{
        icon: MessageSquareHeart,
        message: "Aucun avis pour le moment.\nLes participants pourront partager leur retour ici.",
      }}
    >
      {feedbacks.length > 0 && (
        <ul>
          {feedbacks.map((feedback, i) => (
            <li
              key={feedback.id}
              className={cn("px-4 py-3.5 sm:px-5", i > 0 && "border-t border-surface")}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium leading-snug">
                  {feedback.user.firstName} {feedback.user.lastName}
                </p>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDate(feedback.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {feedback.user.email}
              </p>
              <div className="mt-2">
                <StarRow rating={feedback.rating} />
              </div>
              {feedback.comment && (
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {feedback.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </FeedSidebarSection>
  );
}
