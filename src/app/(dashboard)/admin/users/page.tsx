import { CompanyType, UserType } from "@prisma/client";
import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getInternalCompany, getPlatformSettings } from "@/lib/platform-settings";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { UsersAdminTable } from "@/components/features/admin/users-admin-table";

export default async function AdminUsersPage() {
  const currentUser = await requireAdmin();

  const [users, clientCompanies, settings, internalCompany] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [{ type: UserType.internal }, { type: UserType.client }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true, type: true, logoUrl: true } },
        globalRoles: true,
      },
    }),
    prisma.company.findMany({
      where: { type: CompanyType.client },
      orderBy: { name: "asc" },
    }),
    getPlatformSettings(),
    getInternalCompany(),
  ]);

  if (!internalCompany) {
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
        internalCompanyId={internalCompany.id}
        organizationName={settings.organizationName}
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
