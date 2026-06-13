import { redirect } from "next/navigation";
import { CompanyType } from "@prisma/client";
import { FolderKanban } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import {
  loadProjectsPageData,
  serializeProjectListItem,
} from "@/lib/loaders/projects-list";
import { isParticipantOnly, isStaff } from "@/lib/permissions";
import { participantRoutes } from "@/lib/routes";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { ProjectFormModal } from "@/components/features/projects/project-form-modal";
import { ProjectsList } from "@/components/features/projects/projects-list";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProjectsPage() {
  const user = await requireAuth();
  const participantOnly = await isParticipantOnly(user.id, user.permissions);
  if (participantOnly) redirect(participantRoutes.trainings);

  const canEdit = isStaff(user.permissions);

  const [activeProjects, deletedProjects, clientCompanies] = await loadProjectsPageData(
    user.id,
    user.permissions,
    canEdit
  );

  const hasAnyProject = activeProjects.length > 0 || deletedProjects.length > 0;

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Projets" }]} />
      <PageHeader
        icon={FolderKanban}
        iconVariant="primary"
        title="Projets"
        description="Projets de formations"
        action={
          canEdit && clientCompanies.length > 0 ? (
            <ProjectFormModal companies={clientCompanies} />
          ) : undefined
        }
      />

      {!hasAnyProject ? (
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Créez votre première mission de formation."
        />
      ) : (
        <ProjectsList
          activeProjects={activeProjects.map(serializeProjectListItem)}
          deletedProjects={deletedProjects.map(serializeProjectListItem)}
          canManageDeleted={canEdit}
        />
      )}
    </div>
  );
}
