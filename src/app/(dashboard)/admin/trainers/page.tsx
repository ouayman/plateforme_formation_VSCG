import { GraduationCap } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { loadAdminTrainersPageData } from "@/lib/loaders/admin-trainers";
import { countLabel } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { DataTable } from "@/components/ui/data-table";
import { SkillDomainBadges } from "@/components/features/admin/skill-domain-badges";
import {
  LazyDeleteButton as DeleteButton,
  LazyTrainerEditButton as TrainerEditButton,
  LazyTrainerFormModal as TrainerFormModal,
  LazyTrainerUnavailabilityModal as TrainerUnavailabilityModal,
} from "@/components/features/admin/lazy-modals";

export default async function AdminTrainersPage() {
  await requireAdmin();

  const [trainers, skillDomains] = await loadAdminTrainersPageData();
  const domainOptions = skillDomains.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Formateurs" }]} />
      <PageHeader
        icon={GraduationCap}
        iconVariant="primary"
        title="Formateurs"
        description="Comptes formateurs VSCG et domaines de compétence"
        action={<TrainerFormModal skillDomains={domainOptions} />}
      />

      <DataTable countLabel={countLabel(trainers.length, "formateur", "formateurs")}>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Formateur</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Domaines de compétence</th>
              <th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {trainers.map((trainer) => {
              const domains = trainer.skillDomains.map((sd) => sd.skillDomain);
              return (
                <tr key={trainer.id}>
                  <td className="font-medium">
                    {trainer.firstName} {trainer.lastName}
                  </td>
                  <td className="text-muted-foreground">{trainer.email}</td>
                  <td className="text-muted-foreground">{trainer.phone || "—"}</td>
                  <td>
                    <SkillDomainBadges domains={domains} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <TrainerUnavailabilityModal
                        trainerId={trainer.id}
                        trainerName={`${trainer.firstName} ${trainer.lastName}`}
                      />
                      <TrainerEditButton
                        trainer={{
                          id: trainer.id,
                          email: trainer.email,
                          firstName: trainer.firstName,
                          lastName: trainer.lastName,
                          phone: trainer.phone,
                          skillDomains: domains,
                        }}
                        skillDomains={domainOptions}
                      />
                      <DeleteButton
                        url={`/api/admin/trainers/${trainer.id}`}
                        confirmMessage={`Retirer ${trainer.firstName} ${trainer.lastName} ?`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
