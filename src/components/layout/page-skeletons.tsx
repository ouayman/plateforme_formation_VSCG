"use client";

function PageHeaderSkeleton({ showAction = false }: { showAction?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-black/[0.06] sm:h-11 sm:w-11" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-black/[0.06] sm:w-52" />
          <div className="h-4 w-64 max-w-full rounded-md bg-black/[0.04]" />
        </div>
      </div>
      {showAction && <div className="h-9 w-28 shrink-0 rounded-lg bg-black/[0.06]" />}
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="aspect-[16/10] bg-black/[0.06]" />
      <div className="flex flex-col space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded bg-black/[0.06]" />
          <div className="h-4 w-1/2 rounded bg-black/[0.04]" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <div className="h-6 w-16 rounded-full bg-black/[0.04]" />
          <div className="h-6 w-24 rounded-full bg-black/[0.04]" />
          <div className="h-6 w-32 rounded-full bg-black/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function AccentCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-black/[0.08]" />
      <div className="space-y-3 p-6 pl-7">
        <div className="h-5 w-2/3 rounded bg-black/[0.06]" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-black/[0.04]" />
          <div className="h-6 w-24 rounded-full bg-black/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function TabsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-9 w-28 rounded-lg bg-black/[0.06]" />
      ))}
    </div>
  );
}

function SectionCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-5 w-28 rounded bg-black/[0.06]" />
        <div className="h-9 w-36 rounded-lg bg-black/[0.06]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <AccentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProjectsPageSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Chargement">
      <PageHeaderSkeleton />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailPageSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Chargement">
      <PageHeaderSkeleton showAction />
      <div>
        <TabsListSkeleton count={4} />
        <SectionCardsSkeleton count={4} />
      </div>
    </div>
  );
}

export function ProgramDetailPageSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Chargement">
      <PageHeaderSkeleton showAction />
      <div>
        <TabsListSkeleton count={2} />
        <SectionCardsSkeleton count={4} />
      </div>
    </div>
  );
}

function CalendarGridSkeleton() {
  return (
    <div className="feed-surface overflow-hidden p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-8 w-36 rounded-lg bg-black/[0.06]" />
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-lg bg-black/[0.06]" />
          <div className="h-8 w-8 rounded-lg bg-black/[0.06]" />
          <div className="h-8 w-8 rounded-lg bg-black/[0.06]" />
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-4 rounded bg-black/[0.04]" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="aspect-square rounded-md bg-black/[0.04]" />
        ))}
      </div>
    </div>
  );
}

function PlanningUpcomingSkeleton() {
  return (
    <aside className="space-y-4">
      <div className="h-4 w-20 rounded bg-black/[0.06]" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex gap-3 border-t border-border/40 py-4 first:border-t-0 first:pt-0">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-black/[0.06]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-full rounded bg-black/[0.06]" />
            <div className="h-3 w-2/3 rounded bg-black/[0.04]" />
            <div className="h-3 w-1/2 rounded bg-black/[0.04]" />
          </div>
        </div>
      ))}
    </aside>
  );
}

export function PlanningPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-5xl animate-pulse space-y-8 pb-10 lg:max-w-none"
      aria-busy="true"
      aria-label="Chargement"
    >
      <PageHeaderSkeleton showAction />
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <CalendarGridSkeleton />
        <PlanningUpcomingSkeleton />
      </div>
    </div>
  );
}
