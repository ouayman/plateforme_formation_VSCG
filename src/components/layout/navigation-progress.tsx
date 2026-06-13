"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const DELAY_MS = 500;

function isInternalNavigation(href: string, pathname: string, search: string) {
  if (!href || href.startsWith("#")) return false;

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const target = `${url.pathname}${url.search}`;
    const current = `${pathname}${search ? `?${search}` : ""}`;
    return target !== current;
  } catch {
    return false;
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [navigating, setNavigating] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setNavigating(false);
    setVisible(false);
  }, [pathname, search]);

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
      if (!isInternalNavigation(anchor.getAttribute("href") ?? "", pathname, search)) return;

      setNavigating(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, search]);

  useEffect(() => {
    if (!navigating) return;

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [navigating]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-[#CD3465]/15"
      role="progressbar"
      aria-label="Chargement de la page"
    >
      <div
        className={cn(
          "h-full w-1/3 rounded-full bg-[#CD3465]",
          "animate-[navigation-progress_1s_ease-in-out_infinite]"
        )}
      />
    </div>
  );
}
