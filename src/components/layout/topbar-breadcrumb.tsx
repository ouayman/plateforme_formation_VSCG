"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useBreadcrumb } from "@/components/layout/breadcrumb-context";
import { participantRoutes } from "@/lib/routes";

const PARTICIPANT_DEFAULT = [{ label: "Mes formations", href: participantRoutes.trainings }];

type TopbarBreadcrumbProps = {
  isParticipantOnly?: boolean;
};

export function TopbarBreadcrumb({ isParticipantOnly = false }: TopbarBreadcrumbProps) {
  const { items } = useBreadcrumb();
  const crumbs =
    items.length > 0 ? items : isParticipantOnly ? PARTICIPANT_DEFAULT : [];

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1 text-[13px]">
      {crumbs.map((item, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${item.href ?? ""}-${item.label}`} className="flex min-w-0 items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="truncate font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "truncate font-semibold text-foreground"
                    : "truncate font-medium text-muted-foreground"
                }
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
