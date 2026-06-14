"use client";

function ParticipantFormationCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="hero-banner-base min-h-[7.5rem] p-4">
        <div className="h-5 w-4/5 rounded-md bg-white/15" />
        <div className="mt-2 h-5 w-3/5 rounded-md bg-white/10" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-black/[0.06]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-full rounded bg-black/[0.04]" />
            <div className="h-3 w-2/3 rounded bg-black/[0.04]" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-28 rounded-md bg-black/[0.04]" />
          <div className="h-6 w-24 rounded-md bg-black/[0.04]" />
        </div>
        <div className="mt-auto border-t border-surface pt-3">
          <div className="h-10 rounded-md bg-black/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export function MyTrainingsPageSkeleton() {
  return (
    <div
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-4 sm:-mt-6 md:-mt-8 feed-canvas pb-12 animate-pulse"
      aria-busy="true"
      aria-label="Chargement"
    >
      <header className="feed-glass-banner">
        <div className="relative z-10 mx-auto max-w-[1128px] px-4 py-6 sm:px-6 sm:py-8">
          <div className="h-5 w-32 rounded-md bg-white/10" />
          <div className="mt-3 h-9 w-56 max-w-full rounded-md bg-white/15" />
          <div className="mt-3 h-4 w-48 rounded-md bg-white/10" />
        </div>
      </header>

      <div className="mx-auto max-w-[1128px] px-4 pt-6 sm:px-6">
        <div className="mb-8 flex items-center gap-4 overflow-hidden rounded-lg border border-black/[0.04] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="hero-banner-base h-12 w-12 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-28 rounded bg-black/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-black/[0.06]" />
            <div className="h-3 w-1/2 rounded bg-black/[0.04]" />
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-black/[0.08]" />
              <div className="h-5 w-40 rounded bg-black/[0.06]" />
            </div>
            <div className="space-y-8">
              <div>
                <div className="mb-3 h-5 w-32 rounded-md bg-black/[0.04]" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <ParticipantFormationCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
