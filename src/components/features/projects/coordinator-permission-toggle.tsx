"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CoordinatorToggleProps = {
  projectId: string;
  roleId: string;
  enabled: boolean;
  field:
    | "canPublishFeed"
    | "canAddParticipants"
    | "canUnlockCertificates"
    | "canManageSessions";
  labels: { on: string; off: string };
  activeClassName: string;
  activeDotClassName: string;
};

export function CoordinatorPermissionToggle({
  projectId,
  roleId,
  enabled,
  field,
  labels,
  activeClassName,
  activeDotClassName,
}: CoordinatorToggleProps) {
  const [active, setActive] = useState(enabled);

  useEffect(() => {
    setActive(enabled);
  }, [enabled]);

  async function toggle() {
    const next = !active;
    setActive(next);

    const res = await fetch(`/api/projects/${projectId}/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });

    if (!res.ok) {
      setActive(!next);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? activeClassName
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
      )}
    >
      <span
        className={cn("h-2 w-2 rounded-full", active ? activeDotClassName : "bg-slate-300")}
      />
      {active ? labels.on : labels.off}
    </button>
  );
}
