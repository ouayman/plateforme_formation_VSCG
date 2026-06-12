"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareHeart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedSidebarSection } from "@/components/features/training-feed/feed-sidebar-section";

type FeedFeedbackPanelProps = {
  trainingId: string;
  myFeedback: { rating: number; comment: string | null } | null;
  canSubmit?: boolean;
  embedded?: boolean;
};

export function FeedFeedbackPanel({
  trainingId,
  myFeedback,
  canSubmit = true,
  embedded = false,
}: FeedFeedbackPanelProps) {
  const router = useRouter();
  const [rating, setRating] = useState(myFeedback?.rating ?? 0);
  const [comment, setComment] = useState(myFeedback?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(!!myFeedback);

  async function handleSubmit() {
    if (rating < 1 || loading) return;
    setLoading(true);

    const res = await fetch(`/api/trainings/${trainingId}/feedbacks/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment.trim() || null }),
    });

    setLoading(false);
    if (!res.ok) return;
    setSaved(true);
    router.refresh();
  }

  const form = (
    <div id="feed-feedback" className="scroll-mt-24 px-4 py-4 sm:px-5">
      {!canSubmit ? (
        <p className="text-[12px] text-muted-foreground">
          Votre avis sera disponible après votre première présence à une session.
        </p>
      ) : (
        <>
          <p className="text-[12px] text-muted-foreground">
            {saved
              ? "Merci pour votre retour — vous pouvez le modifier à tout moment."
              : "Partagez votre expérience sur cette formation."}
          </p>

          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={cn(
                  "rounded p-0.5 transition hover:scale-110",
                  star <= rating ? "text-amber-500" : "text-muted-foreground/30"
                )}
              >
                <Star className={cn("h-5 w-5", star <= rating && "fill-current")} />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire (optionnel)"
            rows={2}
            className="mt-3 w-full resize-none rounded-lg bg-black/[0.03] px-3 py-2 text-[13px] outline-none ring-1 ring-transparent focus:ring-[#CD3465]/20"
          />

          <button
            type="button"
            disabled={rating < 1 || loading}
            onClick={handleSubmit}
            className="mt-3 w-full rounded-full bg-[#CD3465] py-2 text-[13px] font-semibold text-white transition hover:bg-[#b82d58] disabled:opacity-40"
          >
            {loading ? "Envoi..." : saved ? "Mettre à jour" : "Envoyer mon avis"}
          </button>
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <section className="feed-surface scroll-mt-24 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-surface px-4 py-3 sm:px-5">
          <MessageSquareHeart className="h-4 w-4 text-[#CD3465]" strokeWidth={1.75} />
          <p className="text-[13px] font-semibold text-[#0a0a0a]">Votre avis</p>
        </div>
        {form}
      </section>
    );
  }

  return (
    <FeedSidebarSection icon={MessageSquareHeart} title="Votre avis">
      {form}
    </FeedSidebarSection>
  );
}
