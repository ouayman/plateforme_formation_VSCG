"use client";

import { usePathname } from "next/navigation";
import { useSoftRefresh } from "@/hooks/use-soft-refresh";

/** Revalide la page courante sans bloquer l'UI (startTransition). */
export function usePathRefresh() {
  const pathname = usePathname();
  const { refresh, isPending } = useSoftRefresh();

  return {
    refreshCurrentPath: () => refresh(pathname),
    refreshPath: (path: string) => refresh(path),
    isPending,
  };
}
