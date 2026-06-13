"use client";

import { CoordinatorPermissionToggle } from "@/components/features/projects/coordinator-permission-toggle";

type CoordinatorParticipantToggleProps = {
  projectId: string;
  roleId: string;
  enabled: boolean;
};

export function CoordinatorParticipantToggle({
  projectId,
  roleId,
  enabled,
}: CoordinatorParticipantToggleProps) {
  return (
    <CoordinatorPermissionToggle
      projectId={projectId}
      roleId={roleId}
      enabled={enabled}
      field="canAddParticipants"
      labels={{ on: "Participants autorisé", off: "Participants interdit" }}
      activeClassName="border-emerald-200 bg-emerald-50 text-emerald-800"
      activeDotClassName="bg-emerald-500"
    />
  );
}
