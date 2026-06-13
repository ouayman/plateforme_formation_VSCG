"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { revalidateAppPath } from "@/lib/revalidate-actions";

export function useSoftRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(
    (path?: string) => {
      startTransition(() => {
        if (path) {
          void revalidateAppPath(path).then(() => router.refresh());
          return;
        }
        router.refresh();
      });
    },
    [router]
  );

  return { refresh, isPending };
}
