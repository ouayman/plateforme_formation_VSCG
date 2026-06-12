import { UserCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { AccountForm } from "@/components/features/account/account-form";
import type { GlobalRoleValue } from "@/lib/user-roles";

export default async function AccountPage() {
  const user = await requireAuth();

  const fullUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      company: { select: { name: true } },
      globalRoles: true,
      projectRoles: { select: { role: true, projectId: true } },
    },
  });

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Mon compte" }]} />
      <PageHeader
        icon={UserCircle}
        iconVariant="primary"
        title="Mon compte"
        description="Gérez vos informations personnelles"
      />

      <AccountForm
        userId={fullUser.id}
        initial={{
          email: fullUser.email,
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          avatarUrl: fullUser.avatarUrl,
          type: fullUser.type,
          company: fullUser.company.name,
          globalRoles: fullUser.globalRoles.map((r) => r.role as GlobalRoleValue),
          projectRoles: fullUser.projectRoles.map((r) => ({ role: r.role })),
        }}
      />
    </div>
  );
}
