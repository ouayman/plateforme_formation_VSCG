"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  getSkeletonRouteKey,
  isInternalNavigation,
  resolveInternalPath,
  type SkeletonRouteKey,
} from "@/lib/route-skeleton-match";
import {
  PlanningPageSkeleton,
  ProgramDetailPageSkeleton,
  ProjectDetailPageSkeleton,
  ProjectsPageSkeleton,
} from "@/components/layout/page-skeletons";
import { MyTrainingsPageSkeleton } from "@/components/features/participant/my-trainings-page-skeleton";
import { TrainingFeedPageSkeleton } from "@/components/features/training-feed/training-feed-page-skeleton";

function renderRouteSkeleton(key: SkeletonRouteKey) {
  switch (key) {
    case "projects-list":
      return <ProjectsPageSkeleton />;
    case "project-detail":
      return <ProjectDetailPageSkeleton />;
    case "program-detail":
      return <ProgramDetailPageSkeleton />;
    case "training-feed":
      return <TrainingFeedPageSkeleton />;
    case "my-trainings":
      return <MyTrainingsPageSkeleton />;
    case "planning":
      return <PlanningPageSkeleton />;
  }
}

export function NavigationPendingContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!isInternalNavigation(href, pathname)) return;

      const path = resolveInternalPath(href);
      if (!path || !getSkeletonRouteKey(path)) return;

      setPendingPath(path);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (pendingPath) {
    const key = getSkeletonRouteKey(pendingPath);
    if (key) return renderRouteSkeleton(key);
  }

  return children;
}
