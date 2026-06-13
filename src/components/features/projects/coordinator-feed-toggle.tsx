"use client";

import { CoordinatorPermissionToggle } from "@/components/features/projects/coordinator-permission-toggle";

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
  return (
    <CoordinatorPermissionToggle
      projectId={projectId}
      roleId={roleId}
      enabled={enabled}
      field="canPublishFeed"
      labels={{ on: "Feed autorisé", off: "Feed interdit" }}
      activeClassName="border-violet-200 bg-violet-50 text-violet-800"
      activeDotClassName="bg-violet-500"
    />
  );
}
