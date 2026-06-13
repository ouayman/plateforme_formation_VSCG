import { Layers } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { loadAdminSkillDomainsPageData } from "@/lib/loaders/admin-skill-domains";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { LazySkillDomainFormModal as SkillDomainFormModal } from "@/components/features/admin/lazy-modals";
import { SkillDomainsAdminTable } from "@/components/features/admin/skill-domains-admin-table";

export default async function AdminSkillDomainsPage() {
  await requireAdmin();
  const [domains, trainers] = await loadAdminSkillDomainsPageData();

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Domaines de compétence" }]} />
      <PageHeader
        icon={Layers}
        iconVariant="primary"
        title="Domaines de compétence"
        description="Référentiel des domaines formateurs et formations"
        action={<SkillDomainFormModal />}
      />

      <SkillDomainsAdminTable
        domains={domains.map((d) => ({
          id: d.id,
          name: d.name,
          trainingCount: d._count.trainings,
          assignedTrainerIds: d.trainers.map((t) => t.userId),
        }))}
        trainers={trainers}
      />
    </div>
  );
}
