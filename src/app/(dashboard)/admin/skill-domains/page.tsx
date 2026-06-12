import { GlobalRole } from "@prisma/client";
import { Layers } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import {
  SkillDomainFormModal,
  SkillDomainsAdminTable,
} from "@/components/features/admin/skill-domains-admin-table";

export default async function AdminSkillDomainsPage() {
  await requireAdmin();

  const [domains, trainers] = await Promise.all([
    prisma.skillDomain.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        trainers: { select: { userId: true } },
        _count: { select: { trainings: true } },
      },
    }),
    prisma.user.findMany({
      where: { globalRoles: { some: { role: GlobalRole.TRAINER } } },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
  ]);

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
