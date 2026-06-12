"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, startOfWeek } from "@/lib/calendar-week";
import { formatDate } from "@/lib/format";

type WeekNavigatorProps = {
  weekStart: Date;
  onWeekStartChange: (weekStart: Date) => void;
};

export function WeekNavigator({ weekStart, onWeekStartChange }: WeekNavigatorProps) {
  const weekEnd = addDays(weekStart, 6);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onWeekStartChange(addDays(weekStart, -7))}
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onWeekStartChange(startOfWeek(new Date()))}
        >
          Aujourd&apos;hui
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onWeekStartChange(addDays(weekStart, 7))}
          aria-label="Semaine suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[13px] font-medium text-muted-foreground">
        Semaine du {formatDate(weekStart)} au {formatDate(weekEnd)}
      </p>
    </div>
  );
}
