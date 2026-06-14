import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { CompanyType } from "@prisma/client";

import { requireAuth } from "@/lib/auth/require";
import { getActiveCompanyId, type ClientCompanyUser } from "@/lib/active-company";
import { canManageClientCompany } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { ClientCompanyForm } from "@/components/features/account/client-company-form";

export default async function ClientCompanyPage() {
  const user = await requireAuth();
  const activeCompanyId = await getActiveCompanyId(user.id, user as ClientCompanyUser);

  if (
    !activeCompanyId ||
    !(await canManageClientCompany(user.id, activeCompanyId, user.permissions))
  ) {
    redirect("/account");
  }

  const company = await prisma.company.findUnique({
    where: { id: activeCompanyId, type: CompanyType.client },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!company) redirect("/account");

  return (
    <div className="space-y-8">
      <SetBreadcrumb
        items={[
          { label: "Mon compte", href: "/account" },
          { label: "Mon entreprise" },
        ]}
      />
      <PageHeader
        icon={Building2}
        iconVariant="primary"
        title="Mon entreprise"
        description="Gérez les informations de votre entreprise cliente"
      />

      <ClientCompanyForm
        companyId={company.id}
        initial={{ name: company.name, logoUrl: company.logoUrl }}
      />
    </div>
  );
}
