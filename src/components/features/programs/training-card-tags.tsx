import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CircleDot,
  FileText,
  GraduationCap,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  trainingLifecycleLabel,
  type TrainingLifecycleStatus,
} from "@/lib/training-ui";

function TagBullet() {
  return (
    <span className="px-0.5 text-[11px] text-muted-foreground/50" aria-hidden>
      ·
    </span>
  );
}

function CountTag({
  count,
  icon: Icon,
  singular,
  plural,
}: {
  count: number;
  icon: LucideIcon;
  singular: string;
  plural: string;
}) {
  const empty = count === 0;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[11px] font-normal",
        empty
          ? "border-border/60 bg-muted/30 text-muted-foreground"
          : "border-blue-200/80 bg-blue-50 text-blue-700"
      )}
    >
      <Icon className="h-3 w-3" />
      {count} {count === 1 ? singular : plural}
    </Badge>
  );
}

function StatusTag({
  lifecycleStatus,
  sessionCount,
}: {
  lifecycleStatus: TrainingLifecycleStatus;
  sessionCount: number;
}) {
  if (sessionCount === 0) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-200/80 bg-amber-50 text-[11px] font-normal text-amber-800"
      >
        <TriangleAlert className="h-3 w-3" />
        Sessions à planifier
      </Badge>
    );
  }

  const styles: Record<
    TrainingLifecycleStatus,
    { badge: string; icon: LucideIcon }
  > = {
    upcoming: { badge: "border-blue-200/80 bg-blue-50 text-blue-700", icon: Calendar },
    in_progress: { badge: "border-amber-200/80 bg-amber-50 text-amber-800", icon: CircleDot },
    completed: { badge: "border-emerald-200/80 bg-emerald-50 text-emerald-700", icon: Calendar },
    none: { badge: "border-border/60 bg-muted/30 text-muted-foreground", icon: Calendar },
  };

  const style = styles[lifecycleStatus];
  const StatusIcon = style.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 text-[11px] font-normal", style.badge)}>
      <StatusIcon className="h-3 w-3" />
      {trainingLifecycleLabel(lifecycleStatus)}
    </Badge>
  );
}

export function TrainingCardTags({
  participantCount,
  documentCount,
  sessionCount,
  lifecycleStatus,
}: {
  participantCount: number;
  documentCount: number;
  sessionCount: number;
  lifecycleStatus: TrainingLifecycleStatus;
}) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-y-1">
      <CountTag count={participantCount} icon={Users} singular="participant" plural="participants" />
      <TagBullet />
      <CountTag count={documentCount} icon={FileText} singular="document" plural="documents" />
      <TagBullet />
      <CountTag count={sessionCount} icon={Calendar} singular="session" plural="sessions" />
      <TagBullet />
      <StatusTag lifecycleStatus={lifecycleStatus} sessionCount={sessionCount} />
    </div>
  );
}

export function ProgramCardTags({
  trainingCount,
  participantCount,
}: {
  trainingCount: number;
  participantCount: number;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-y-1">
      <CountTag
        count={trainingCount}
        icon={GraduationCap}
        singular="formation"
        plural="formations"
      />
      <TagBullet />
      <CountTag
        count={participantCount}
        icon={Users}
        singular="participant"
        plural="participants"
      />
    </div>
  );
}
