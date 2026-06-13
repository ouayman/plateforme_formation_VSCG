import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { loadAdminUsersPageData } from "@/lib/loaders/admin-users";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { UsersAdminTable } from "@/components/features/admin/users-admin-table";

export default async function AdminUsersPage() {
  const currentUser = await requireAdmin();
  const { users, clientCompanies, organizationName, internalCompanyId } =
    await loadAdminUsersPageData();

  if (!internalCompanyId) {
    throw new Error("Organisation VSCG introuvable. Lancez le seed.");
  }

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Utilisateurs" }]} />
      <PageHeader
        icon={Users}
        iconVariant="primary"
        title="Utilisateurs"
        description="Comptes staff VSCG et utilisateurs clients (coordinateurs, habilitations, etc.)"
      />

      <UsersAdminTable
        currentUserId={currentUser.id}
        clientCompanies={clientCompanies}
        internalCompanyId={internalCompanyId}
        organizationName={organizationName}
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          companyId: user.companyId,
          type: user.type,
          loginCount: user.loginCount,
          company: user.company,
          globalRoles: user.globalRoles.map((r) => r.role),
        }))}
      />
    </div>
  );
}
