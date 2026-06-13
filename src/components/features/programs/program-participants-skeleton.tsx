export function ProgramParticipantsSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Chargement des participants">
      <div className="h-10 w-full rounded-xl bg-muted/80" />
      <div className="h-10 w-full rounded-xl bg-muted/60" />
      <div className="h-10 w-full rounded-xl bg-muted/60" />
    </div>
  );
}
