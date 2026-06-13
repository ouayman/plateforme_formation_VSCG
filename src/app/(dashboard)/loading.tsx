export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full rounded-md bg-muted/70" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-2xl bg-muted/80" />
        <div className="h-28 rounded-2xl bg-muted/80" />
        <div className="h-28 rounded-2xl bg-muted/80 sm:col-span-2 lg:col-span-1" />
      </div>
      <div className="space-y-3">
        <div className="h-40 rounded-2xl bg-muted/60" />
        <div className="h-40 rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}
