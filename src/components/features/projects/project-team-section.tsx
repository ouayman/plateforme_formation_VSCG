"use client";

import { useMemo, useState } from "react";
import { Search, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectRoleModal } from "@/components/features/projects/project-role-modal";
import { CoordinatorRoleModal } from "@/components/features/projects/coordinator-role-modal";
import { CoordinatorPermissionsInline } from "@/components/features/projects/coordinator-permissions";
import { DeleteButton } from "@/components/features/projects/delete-button";
import { SectionBlock } from "@/components/layout/section-block";
import { EmptyState } from "@/components/ui/empty-state";
import { countLabel } from "@/lib/format";

type CoordinatorRole = {
  id: string;
  userId: string;
  canAddParticipants: boolean;
  canPublishFeed: boolean;
  canUnlockCertificates: boolean;
  canManageSessions: boolean;
  user: { firstName: string; lastName: string; email: string };
};

type ProjectCoordinatorsSectionProps = {
  projectId: string;
  coordinators: CoordinatorRole[];
  coordinatorUsers: { id: string; firstName: string; lastName: string; email: string }[];
};

export function ProjectCoordinatorsSection({
  projectId,
  coordinators,
  coordinatorUsers,
}: ProjectCoordinatorsSectionProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coordinators;
    return coordinators.filter((r) => {
      const haystack = `${r.user.firstName} ${r.user.lastName} ${r.user.email}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [coordinators, search]);

  return (
    <SectionBlock
      title="Coordinateurs"
      countLabel={countLabel(filtered.length, "coordinateur", "coordinateurs")}
      action={
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-44">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-[13px]"
            />
          </div>
          <ProjectRoleModal
            projectId={projectId}
            coordinatorUsers={coordinatorUsers}
            existingCoordinatorIds={coordinators.map((r) => r.userId)}
          />
        </div>
      }
    >
      <div className="space-y-4 px-4 pb-2 pt-3">
        <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-[13px] text-muted-foreground">
          Assignez les coordinateurs clients du projet et leurs habilitations. Les formateurs
          sont affectés directement sur les sessions.
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="Aucun coordinateur"
            description="Assignez un coordinateur client pour ce projet."
          />
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Coordinateur</th>
                <th>Email</th>
                <th>Habilitations</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((pr) => (
                <tr key={pr.id}>
                  <td className="font-medium">
                    {pr.user.firstName} {pr.user.lastName}
                  </td>
                  <td className="text-muted-foreground">{pr.user.email}</td>
                  <td>
                    <CoordinatorPermissionsInline
                      value={{
                        canAddParticipants: pr.canAddParticipants,
                        canPublishFeed: pr.canPublishFeed,
                        canUnlockCertificates: pr.canUnlockCertificates,
                        canManageSessions: pr.canManageSessions,
                      }}
                    />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <CoordinatorRoleModal
                        projectId={projectId}
                        roleId={pr.id}
                        user={pr.user}
                        permissions={{
                          canAddParticipants: pr.canAddParticipants,
                          canPublishFeed: pr.canPublishFeed,
                          canUnlockCertificates: pr.canUnlockCertificates,
                          canManageSessions: pr.canManageSessions,
                        }}
                      />
                      <DeleteButton url={`/api/projects/${projectId}/roles/${pr.id}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </SectionBlock>
  );
}

/** @deprecated alias — utiliser ProjectCoordinatorsSection */
export const ProjectTeamSection = ProjectCoordinatorsSection;
