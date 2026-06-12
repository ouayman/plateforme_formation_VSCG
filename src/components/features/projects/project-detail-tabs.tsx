"use client";

import type { LucideIcon } from "lucide-react";
import { MapPin, PenLine, Route, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionBlock } from "@/components/layout/section-block";
import { ProgramFormModal } from "@/components/features/programs/program-form-modal";
import { ProgramCards } from "@/components/features/programs/program-cards";
import { ProjectCoordinatorsSection } from "@/components/features/projects/project-team-section";
import { LocationFormModal, LocationEditButton } from "@/components/features/projects/location-form-modal";
import { SignatoryFormModal, SignatoryEditButton } from "@/components/features/projects/signatory-form-modal";
import { SignaturePreview } from "@/components/ui/signature-input";
import { DeleteButton } from "@/components/features/projects/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { countLabel } from "@/lib/format";

type TabItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

type ProjectDetailTabsProps = {
  projectId: string;
  canEdit: boolean;
  programs: Parameters<typeof ProgramCards>[0]["programs"];
  coordinators: Parameters<typeof ProjectCoordinatorsSection>[0]["coordinators"];
  locations: {
    id: string;
    name: string;
    address: string | null;
    instructions: string | null;
  }[];
  signatories: {
    id: string;
    name: string;
    title: string;
    signatureImageUrl: string;
  }[];
  coordinatorUsers: { id: string; firstName: string; lastName: string; email: string }[];
  nextProgramOrder: number;
};

export function ProjectDetailTabs({
  projectId,
  canEdit,
  programs,
  coordinators,
  locations,
  signatories,
  coordinatorUsers,
  nextProgramOrder,
}: ProjectDetailTabsProps) {
  const tabs: TabItem[] = [
    { value: "programs", label: "Programmes", icon: Route, count: programs.length },
    ...(canEdit
      ? [{ value: "coordinators", label: "Coordinateurs", icon: Users, count: coordinators.length }]
      : []),
    { value: "locations", label: "Lieux", icon: MapPin, count: locations.length },
    { value: "signatories", label: "Signataires attestations", icon: PenLine, count: signatories.length },
  ];

  return (
    <Tabs defaultValue="programs" className="w-full">
      <TabsList className="mb-0">
        {tabs.map(({ value, label, icon: Icon, count }) => (
          <TabsTrigger key={value} value={value} className="group">
            <Icon className="h-4 w-4" />
            {label}
            {count !== undefined && count > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold group-data-[state=active]:bg-white/20">
                {count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="programs" className="mt-6">
        <SectionBlock
          title="Programmes"
          variant="plain"
          countLabel={countLabel(programs.length, "programme", "programmes")}
          action={
            canEdit ? (
              <ProgramFormModal projectId={projectId} nextOrderIndex={nextProgramOrder} />
            ) : undefined
          }
        >
          {programs.length === 0 ? (
            <EmptyState
              icon={Route}
              title="Aucun programme"
              description="Structurez la formation en programmes."
            />
          ) : (
            <ProgramCards projectId={projectId} programs={programs} canEdit={canEdit} />
          )}
        </SectionBlock>
      </TabsContent>

      {canEdit && (
        <TabsContent value="coordinators" className="mt-6">
          <ProjectCoordinatorsSection
            projectId={projectId}
            coordinators={coordinators}
            coordinatorUsers={coordinatorUsers}
          />
        </TabsContent>
      )}

      <TabsContent value="locations" className="mt-6">
        <SectionBlock
          title="Lieux de formation"
          countLabel={countLabel(locations.length, "lieu", "lieux")}
          action={canEdit ? <LocationFormModal projectId={projectId} /> : undefined}
        >
          {locations.length === 0 ? (
            <EmptyState icon={MapPin} title="Aucun lieu" description="Ajoutez les sites de formation." />
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Lieu</th>
                  <th>Adresse</th>
                  <th>Instructions</th>
                  {canEdit && <th className="w-24" />}
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id}>
                    <td className="font-medium">{loc.name}</td>
                    <td className="text-muted-foreground">{loc.address || "—"}</td>
                    <td className="max-w-xs truncate text-muted-foreground">
                      {loc.instructions || "—"}
                    </td>
                    {canEdit && (
                      <td>
                        <div className="flex justify-end gap-1">
                          <LocationEditButton projectId={projectId} location={loc} />
                          <DeleteButton url={`/api/projects/${projectId}/locations/${loc.id}`} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionBlock>
      </TabsContent>

      <TabsContent value="signatories" className="mt-6">
        <SectionBlock
          title="Signataires des attestations"
          countLabel={countLabel(signatories.length, "signataire", "signataires")}
          action={canEdit ? <SignatoryFormModal projectId={projectId} /> : undefined}
        >
          {signatories.length === 0 ? (
            <EmptyState
              icon={PenLine}
              title="Aucun signataire"
              description="Définissez les signataires des attestations."
            />
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Fonction</th>
                  <th>Signature</th>
                  {canEdit && <th className="w-24" />}
                </tr>
              </thead>
              <tbody>
                {signatories.map((sig) => (
                  <tr key={sig.id}>
                    <td className="font-medium">{sig.name}</td>
                    <td className="text-muted-foreground">{sig.title}</td>
                    <td>
                      <SignaturePreview url={sig.signatureImageUrl} alt={`Signature de ${sig.name}`} />
                    </td>
                    {canEdit && (
                      <td>
                        <div className="flex justify-end gap-1">
                          <SignatoryEditButton projectId={projectId} signatory={sig} />
                          <DeleteButton
                            url={`/api/projects/${projectId}/signatories/${sig.id}`}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionBlock>
      </TabsContent>
    </Tabs>
  );
}
