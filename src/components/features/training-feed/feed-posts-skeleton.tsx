export function FeedPostsSkeleton() {
  return (
    <div className="animate-pulse px-4 py-6 sm:px-5">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-black/[0.06]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-black/[0.06]" />
          <div className="h-3 w-full max-w-md rounded bg-black/[0.04]" />
          <div className="h-3 w-4/5 max-w-sm rounded bg-black/[0.04]" />
        </div>
      </div>
      <div className="mt-6 flex gap-3 border-t border-surface pt-6">
        <div className="h-10 w-10 shrink-0 rounded-full bg-black/[0.06]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-40 rounded bg-black/[0.06]" />
          <div className="h-3 w-full max-w-lg rounded bg-black/[0.04]" />
        </div>
      </div>
    </div>
  );
}
