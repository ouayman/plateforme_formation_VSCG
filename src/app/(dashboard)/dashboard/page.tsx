import { redirect } from "next/navigation";
import { FolderKanban, GraduationCap, Users } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { isParticipantOnly, projectListFilter } from "@/lib/permissions";
import { participantRoutes } from "@/lib/routes";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { StatCard } from "@/components/ui/stat-card";

export default async function DashboardPage() {
  const user = await requireAuth();

  if (await isParticipantOnly(user.id)) {
    redirect(participantRoutes.trainings);
  }

  const projectFilter = projectListFilter(user.id, user.permissions);

  const [projectCount, sessionCount, participantCount] = await Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.session.count({
      where: {
        startDatetime: { gte: new Date() },
        training: { program: { project: projectFilter } },
      },
    }),
    prisma.userProgram.count({
      where: { program: { project: projectFilter } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Tableau de bord" }]} />
      <PageHeader
        icon={FolderKanban}
        iconVariant="primary"
        title="Tableau de bord"
        description="Vue d'ensemble de vos formations"
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Projets actifs"
          value={projectCount}
          icon={FolderKanban}
          variant="primary"
        />
        <StatCard
          label="Sessions à venir"
          value={sessionCount}
          icon={GraduationCap}
          variant="blue"
        />
        <StatCard
          label="Participants inscrits"
          value={participantCount}
          icon={Users}
          variant="emerald"
        />
      </div>
    </div>
  );
}
