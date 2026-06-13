import { Contact } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { loadAdminParticipantsPageData } from "@/lib/loaders/admin-participants";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { ParticipantsAdminTable } from "@/components/features/admin/participants-admin-table";

export default async function AdminParticipantsPage() {
  const currentUser = await requireAdmin();
  const { participants, clientCompanies } = await loadAdminParticipantsPageData();

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
