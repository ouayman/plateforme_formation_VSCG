"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SkillDomainBadge = { id: string; name: string };

type SkillDomainBadgesProps = {
  domains: SkillDomainBadge[];
  maxVisible?: number;
};

export function SkillDomainBadges({ domains, maxVisible = 2 }: SkillDomainBadgesProps) {
  const [open, setOpen] = useState(false);

  if (domains.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = domains.slice(0, maxVisible);
  const hiddenCount = domains.length - visible.length;

  return (
    <>
      <div className="flex max-w-[220px] flex-wrap items-center gap-1">
        {visible.map((d) => (
          <Badge key={d.id} variant="outline" className="max-w-full truncate text-[10px]">
            {d.name}
          </Badge>
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary"
          >
            +{hiddenCount}
          </button>
        )}
      </div>

      {hiddenCount > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Domaines de compétence</DialogTitle>
            </DialogHeader>
            <div className="max-h-72 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {domains.map((d) => (
                  <Badge key={d.id} variant="outline" className="text-[11px]">
                    {d.name}
                  </Badge>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
