"use client";

import { CoordinatorPermissionToggle } from "@/components/features/projects/coordinator-permission-toggle";

type CoordinatorCertificateToggleProps = {
  projectId: string;
  roleId: string;
  enabled: boolean;
};

export function CoordinatorCertificateToggle({
  projectId,
  roleId,
  enabled,
}: CoordinatorCertificateToggleProps) {
  return (
    <CoordinatorPermissionToggle
      projectId={projectId}
      roleId={roleId}
      enabled={enabled}
      field="canUnlockCertificates"
      labels={{ on: "Attestations autorisées", off: "Attestations interdites" }}
      activeClassName="border-violet-200 bg-violet-50 text-violet-800"
      activeDotClassName="bg-violet-500"
    />
  );
}
