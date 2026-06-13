import { CompanyType, UserType } from "@prisma/client";
import { Contact } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { ParticipantsAdminTable } from "@/components/features/admin/participants-admin-table";

export default async function AdminParticipantsPage() {
  const currentUser = await requireAdmin();

  const [participants, clientCompanies] = await Promise.all([
    prisma.user.findMany({
      where: {
        type: UserType.client,
        globalRoles: { none: {} },
        projectRoles: { none: {} },
      },
      orderBy: { lastName: "asc" },
      take: 500,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        companyId: true,
        loginCount: true,
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.company.findMany({
      where: { type: CompanyType.client },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Participants" }]} />
      <PageHeader
        icon={Contact}
        iconVariant="primary"
        title="Participants"
        description="Comptes clients sans rôle staff — inscrits aux programmes via les projets"
      />

      <ParticipantsAdminTable
        currentUserId={currentUser.id}
        clientCompanies={clientCompanies}
        participants={participants.map((p) => ({
          id: p.id,
          email: p.email,
          firstName: p.firstName,
          lastName: p.lastName,
          avatarUrl: p.avatarUrl,
          companyId: p.companyId,
          loginCount: p.loginCount,
          company: p.company,
        }))}
      />
    </div>
  );
}
