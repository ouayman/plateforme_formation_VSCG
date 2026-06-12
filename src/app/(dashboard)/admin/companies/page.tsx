import { CompanyType } from "@prisma/client";
import { Building2, FolderKanban, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { countLabel } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import {
  CompanyEditButton,
  CreateCompanyModal,
} from "@/components/features/admin/company-form-modal";
import { DeleteButton } from "@/components/features/projects/delete-button";
import { DataTable } from "@/components/ui/data-table";
import { OrgLogo } from "@/components/layout/org-logo";

export default async function AdminCompaniesPage() {
  await requireAdmin();

  const companies = await prisma.company.findMany({
    where: { type: CompanyType.client },
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, projects: true } } },
  });

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Entreprises clientes" }]} />
      <PageHeader
        icon={Building2}
        iconVariant="primary"
        title="Entreprises clientes"
        description="Clients rattachés aux projets de formation"
        action={<CreateCompanyModal />}
      />

      <DataTable countLabel={countLabel(companies.length, "entreprise", "entreprises")}>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Utilisateurs</th>
              <th>Projets</th>
              <th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>
                  <div className="flex items-center gap-3">
                    {company.logoUrl ? (
                      <OrgLogo
                        logoUrl={company.logoUrl}
                        alt={company.name}
                        variant="thumbnail"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                    )}
                    <span className="font-medium">{company.name}</span>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {company._count.users}
                  </span>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {company._count.projects}
                  </span>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <CompanyEditButton
                      company={{
                        id: company.id,
                        name: company.name,
                        type: "client",
                        logoUrl: company.logoUrl,
                      }}
                    />
                    <DeleteButton
                      url={`/api/companies/${company.id}`}
                      confirmMessage={`Supprimer ${company.name} ?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
