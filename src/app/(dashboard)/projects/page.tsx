import { redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { redirectIfParticipantOnly } from "@/lib/auth/participant-guard";
import { requireAuth } from "@/lib/auth/require";
import {
  loadProjectsPageData,
  serializeProjectListItem,
} from "@/lib/loaders/projects-list";
import { isStaff } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { LazyProjectFormModal as ProjectFormModal } from "@/components/features/projects/lazy-modals";
import { ProjectsList } from "@/components/features/projects/projects-list";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProjectsPage() {
  const user = await requireAuth();
  await redirectIfParticipantOnly(user);
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
          description={
            canEdit
              ? "Créez votre première mission de formation."
              : "Aucun projet accessible pour le moment."
          }
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
