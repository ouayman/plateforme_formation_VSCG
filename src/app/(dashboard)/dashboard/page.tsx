import { redirect } from "next/navigation";
import { FolderKanban, GraduationCap, Users } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import { loadDashboardStats } from "@/lib/loaders/dashboard";
import { isParticipantOnly } from "@/lib/permissions";
import { participantRoutes } from "@/lib/routes";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { StatCard } from "@/components/ui/stat-card";

export default async function DashboardPage() {
  const user = await requireAuth();

  if (await isParticipantOnly(user.id, user.permissions)) {
    redirect(participantRoutes.trainings);
  }

  const [projectCount, sessionCount, participantCount] = await loadDashboardStats(
    user.id,
    user.permissions
  );

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
