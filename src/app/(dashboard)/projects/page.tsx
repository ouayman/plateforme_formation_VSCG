import { redirect } from "next/navigation";
import { CompanyType } from "@prisma/client";
import { FolderKanban } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { isParticipantOnly, isStaff, projectListFilter } from "@/lib/permissions";
import { participantRoutes } from "@/lib/routes";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { ProjectFormModal } from "@/components/features/projects/project-form-modal";
import { ProjectsList } from "@/components/features/projects/projects-list";
import { EmptyState } from "@/components/ui/empty-state";

const projectInclude = {
  company: { select: { name: true } },
  _count: { select: { programs: true } },
} as const;

function serializeProject(project: {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  deletedAt: Date | null;
  company: { name: string };
  _count: { programs: number };
}) {
  return {
    id: project.id,
    name: project.name,
    startDate: project.startDate.toISOString(),
    endDate: project.endDate.toISOString(),
    deletedAt: project.deletedAt?.toISOString() ?? null,
    company: project.company,
    _count: project._count,
  };
}

export default async function ProjectsPage() {
  const user = await requireAuth();
  const participantOnly = await isParticipantOnly(user.id, user.permissions);
  if (participantOnly) redirect(participantRoutes.trainings);

  const canEdit = isStaff(user.permissions);

  const [activeProjects, deletedProjects, clientCompanies] = await Promise.all([
    prisma.project.findMany({
      where: projectListFilter(user.id, user.permissions),
      orderBy: { startDate: "desc" },
      include: projectInclude,
    }),
    canEdit
      ? prisma.project.findMany({
          where: projectListFilter(user.id, user.permissions, { deletedOnly: true }),
          orderBy: { deletedAt: "desc" },
          include: projectInclude,
        })
      : Promise.resolve([]),
    canEdit
      ? prisma.company.findMany({
          where: { type: CompanyType.client },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

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
          activeProjects={activeProjects.map(serializeProject)}
          deletedProjects={deletedProjects.map(serializeProject)}
          canManageDeleted={canEdit}
        />
      )}
    </div>
  );
}
