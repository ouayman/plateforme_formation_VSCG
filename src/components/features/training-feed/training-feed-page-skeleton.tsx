"use client";

import { FeedPostsSkeleton } from "@/components/features/training-feed/feed-posts-skeleton";

export function TrainingFeedPageSkeleton() {
  return (
    <div
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-4 sm:-mt-6 md:-mt-8 feed-canvas pb-12 animate-pulse"
      aria-busy="true"
      aria-label="Chargement"
    >
      <header className="feed-glass-banner mb-6">
        <div className="relative z-10 mx-auto max-w-[1128px] px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-5 w-28 rounded-md bg-white/10" />
              <div className="h-8 w-2/3 max-w-md rounded-md bg-white/15" />
              <div className="space-y-2">
                <div className="h-2 w-full max-w-xs rounded-full bg-white/10" />
                <div className="h-2 w-4/5 max-w-[280px] rounded-full bg-white/10" />
              </div>
            </div>
            <div className="h-9 w-full shrink-0 rounded-lg bg-white/10 sm:w-56 lg:w-64" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1128px] px-4 sm:px-6">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,640px)_minmax(240px,1fr)] lg:gap-6">
          <div className="feed-surface min-w-0 overflow-hidden">
            <FeedPostsSkeleton />
          </div>

          <div className="hidden space-y-4 lg:block">
            {[0, 1, 2].map((i) => (
              <div key={i} className="feed-surface p-5">
                <div className="mb-3 h-4 w-32 rounded bg-black/[0.06]" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-black/[0.04]" />
                  <div className="h-3 w-4/5 rounded bg-black/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3 lg:hidden">
          <div className="feed-surface h-28" />
          <div className="feed-surface h-36" />
        </div>
      </div>
    </div>
  );
}
