"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactionCounts, ReactionType } from "@/lib/training-feed-utils";

type FeedPostReactionsProps = {
  trainingId: string;
  postId: string;
  initialCounts: ReactionCounts;
  initialUserReaction: ReactionType | null;
};

export function FeedPostReactions({
  trainingId,
  postId,
  initialCounts,
  initialUserReaction,
}: FeedPostReactionsProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction);
  const [pending, setPending] = useState(false);

  const total = counts.like + counts.celebrate + counts.insightful;
  const liked = userReaction === "like";

  async function toggleLike() {
    if (pending) return;
    setPending(true);

    const next = liked ? null : "like";

    const res = await fetch(`/api/trainings/${trainingId}/posts/${postId}/reactions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: next }),
    });

    setPending(false);
    if (!res.ok) return;

    const data = await res.json();
    setCounts(data.reactionCounts);
    setUserReaction(data.userReaction);
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggleLike}
      aria-label={liked ? "Retirer votre réaction" : "Aimer cette publication"}
      className={cn(
        "mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors",
        liked
          ? "text-[#CD3465]"
          : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
      )}
    >
      <ThumbsUp
        className={cn(
          "h-[18px] w-[18px] transition-transform",
          liked && "fill-current animate-feed-pop",
          pending && "opacity-50"
        )}
      />
      {total > 0 && (
        <span className={cn("text-[13px] font-medium tabular-nums", liked && "text-[#CD3465]")}>
          {total}
        </span>
      )}
    </button>
  );
}
