import { notFound, redirect } from "next/navigation";
import { Building2, Calendar, FolderKanban, Pencil } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import {
  canAccessProjectWithSnapshot,
  canManageProjects,
  isParticipantOnly,
} from "@/lib/permissions";
import {
  loadProjectDetail,
  loadProjectEditorData,
} from "@/lib/loaders/project-detail";
import { participantRoutes } from "@/lib/routes";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { LazyProjectFormModal as ProjectFormModal } from "@/components/features/projects/lazy-modals";
import { ProjectDetailTabs } from "@/components/features/projects/project-detail-tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();

  const [participantOnly, project, canEdit] = await Promise.all([
    isParticipantOnly(user.id, user.permissions),
    loadProjectDetail(params.id),
    canManageProjects(user.id, user.permissions),
  ]);

  if (participantOnly) {
    redirect(participantRoutes.trainings);
  }

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

      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn("icon-badge-primary", "h-10 w-10 sm:h-11 sm:w-11")}>
          <FolderKanban className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {project.name}
            </h1>
            {canEdit && (
              <ProjectFormModal
                companies={clientCompanies}
                project={projectForForm}
                lockCompanyChange={lockCompanyChange}
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 px-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
            )}
            {isDeleted && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Supprimé
              </span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {project.company?.name ?? "Client inconnu"}
            </span>
            <span className="text-muted-foreground/40" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {project.startDate.toLocaleDateString("fr-FR")} —{" "}
              {project.endDate.toLocaleDateString("fr-FR")}
            </span>
          </p>
        </div>
      </div>

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
