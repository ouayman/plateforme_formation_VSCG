"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type CoordinatorFeedToggleProps = {
  projectId: string;
  roleId: string;
  enabled: boolean;
};

export function CoordinatorFeedToggle({
  projectId,
  roleId,
  enabled,
}: CoordinatorFeedToggleProps) {
  const router = useRouter();

  async function toggle() {
    await fetch(`/api/projects/${projectId}/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canPublishFeed: !enabled }),
    });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        enabled
          ? "border-violet-200 bg-violet-50 text-violet-800"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
      )}
    >
      <span
        className={cn("h-2 w-2 rounded-full", enabled ? "bg-violet-500" : "bg-slate-300")}
      />
      {enabled ? "Feed autorisé" : "Feed interdit"}
    </button>
  );
}
