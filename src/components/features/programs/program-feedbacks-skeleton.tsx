export function ProgramFeedbacksSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Chargement des avis">
      <div className="h-9 w-48 rounded-lg bg-muted/80" />
      <div className="space-y-3">
        <div className="h-24 rounded-2xl bg-muted/60" />
        <div className="h-24 rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}
