"use client";

import {
  LazySkillDomainEditButton as SkillDomainEditButton,
  LazySkillDomainTrainersModal as SkillDomainTrainersModal,
} from "@/components/features/admin/lazy-modals";
import { DataTable } from "@/components/ui/data-table";
import { countLabel } from "@/lib/format";

type TrainerOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type DomainRow = {
  id: string;
  name: string;
  trainingCount: number;
  assignedTrainerIds: string[];
};

type SkillDomainsAdminTableProps = {
  domains: DomainRow[];
  trainers: TrainerOption[];
};

export function SkillDomainsAdminTable({ domains, trainers }: SkillDomainsAdminTableProps) {
  return (
    <DataTable
      countLabel={countLabel(domains.length, "domaine de compétence", "domaines de compétence")}
    >
      <table className="modern-table">
        <thead>
          <tr>
            <th>Domaine de compétence</th>
            <th>Formateurs</th>
            <th>Formations</th>
            <th className="w-72" />
          </tr>
        </thead>
        <tbody>
          {domains.map((domain) => (
            <tr key={domain.id}>
              <td className="font-medium">{domain.name}</td>
              <td className="text-muted-foreground">{domain.assignedTrainerIds.length}</td>
              <td className="text-muted-foreground">{domain.trainingCount}</td>
              <td>
                <div className="flex items-center justify-end gap-1">
                  <SkillDomainTrainersModal
                    domainId={domain.id}
                    domainName={domain.name}
                    trainers={trainers}
                    assignedTrainerIds={domain.assignedTrainerIds}
                  />
                  <SkillDomainEditButton domain={{ id: domain.id, name: domain.name }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}
