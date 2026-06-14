import { notFound, redirect } from "next/navigation";
import { FolderKanban, Pencil } from "lucide-react";
import { redirectIfParticipantOnly } from "@/lib/auth/participant-guard";
import { requireAuth } from "@/lib/auth/require";
import {
  canAccessProjectWithSnapshot,
  canManageProjects,
} from "@/lib/permissions";
import {
  loadProjectDetail,
  loadProjectEditorData,
} from "@/lib/loaders/project-detail";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { PageHeader } from "@/components/layout/page-header";
import { LazyProjectFormModal as ProjectFormModal } from "@/components/features/projects/lazy-modals";
import { ProjectDetailTabs } from "@/components/features/projects/project-detail-tabs";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  await redirectIfParticipantOnly(user);

  const [project, canEdit] = await Promise.all([
    loadProjectDetail(params.id),
    canManageProjects(user.id, user.permissions),
  ]);

  if (!project) notFound();

  const allowed = await canAccessProjectWithSnapshot(
    user.id,
    params.id,
    { deletedAt: project.deletedAt, companyId: project.companyId },
    user.permissions
  );
  if (!allowed) redirect("/projects");

  const isDeleted = !!project.deletedAt;

  const { coordinatorUsers, clientCompanies } = await loadProjectEditorData(
    project.companyId,
    canEdit,
    isDeleted
  );

  const projectForForm = {
    id: project.id,
    name: project.name,
    companyId: project.companyId,
    startDate: project.startDate.toISOString(),
    endDate: project.endDate.toISOString(),
    deletedAt: project.deletedAt?.toISOString() ?? null,
  };

  const nextProgramOrder =
    project.programs.length > 0
      ? Math.max(...project.programs.map((p) => p.orderIndex)) + 1
      : 0;

  const lockCompanyChange =
    project.projectRoles.length > 0 || project.signatories.length > 0;

  return (
    <div className="space-y-8">
      <SetBreadcrumb
        items={[
          { label: "Projets", href: "/projects" },
          { label: project.name },
        ]}
      />

      <PageHeader
        icon={FolderKanban}
        iconVariant="primary"
        title={project.name}
        description={`${project.company?.name ?? "Client inconnu"} · ${formatDate(project.startDate)} — ${formatDate(project.endDate)}${isDeleted ? " · Supprimé" : ""}`}
        action={
          canEdit ? (
            <ProjectFormModal
              companies={clientCompanies}
              project={projectForForm}
              lockCompanyChange={lockCompanyChange}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
              }
            />
          ) : undefined
        }
      />

      <ProjectDetailTabs
        projectId={project.id}
        canEdit={canEdit && !isDeleted}
        programs={project.programs}
        coordinators={project.projectRoles.map((role) => ({
          id: role.id,
          userId: role.userId,
          canAddParticipants: role.canAddParticipants,
          canPublishFeed: role.canPublishFeed,
          canUnlockCertificates: role.canUnlockCertificates,
          canManageSessions: role.canManageSessions,
          user: role.user,
        }))}
        locations={project.locations}
        signatories={project.signatories}
        coordinatorUsers={coordinatorUsers}
        nextProgramOrder={nextProgramOrder}
      />
    </div>
  );
}
