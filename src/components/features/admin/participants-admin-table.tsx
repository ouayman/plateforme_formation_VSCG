"use client";

import { useMemo, useState } from "react";
import { Building2, Mail, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { InviteParticipantModal } from "@/components/features/admin/invite-participant-modal";
import { ParticipantEditModal } from "@/components/features/admin/participant-edit-modal";
import { DeleteButton } from "@/components/features/projects/delete-button";
import { countLabel } from "@/lib/format";

type ParticipantRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  companyId: string;
  loginCount: number;
  company: { id: string; name: string };
};

type Company = { id: string; name: string };

type ParticipantsAdminTableProps = {
  participants: ParticipantRow[];
  clientCompanies: Company[];
  currentUserId: string;
};

export function ParticipantsAdminTable({
  participants,
  clientCompanies,
  currentUserId,
}: ParticipantsAdminTableProps) {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participants.filter((p) => {
      if (companyFilter !== "all" && p.companyId !== companyFilter) return false;
      if (!q) return true;
      const haystack = `${p.firstName} ${p.lastName} ${p.email} ${p.company.name}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [participants, search, companyFilter]);

  return (
    <div className="space-y-4">
      <div className="surface-panel overflow-hidden p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un participant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <InviteParticipantModal clientCompanies={clientCompanies} />
        </div>
        <div className="mt-4 border-t border-border/40 pt-4">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Entreprise
          </label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="mt-2 h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-[13px] shadow-sm"
          >
            <option value="all">Toutes</option>
            {clientCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable countLabel={countLabel(filtered.length, "participant", "participants")}>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Email</th>
              <th>Entreprise</th>
              <th>Connexions</th>
              <th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">
                  {p.firstName} {p.lastName}
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {p.email}
                  </span>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {p.company.name}
                  </span>
                </td>
                <td>
                  <Badge variant="outline">{p.loginCount}</Badge>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <ParticipantEditModal
                      participant={{
                        id: p.id,
                        email: p.email,
                        firstName: p.firstName,
                        lastName: p.lastName,
                        avatarUrl: p.avatarUrl,
                        companyId: p.companyId,
                      }}
                      clientCompanies={clientCompanies}
                    />
                    {p.id !== currentUserId && (
                      <DeleteButton
                        url={`/api/users/${p.id}`}
                        confirmMessage={`Supprimer ${p.firstName} ${p.lastName} ?`}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucun participant ne correspond aux filtres.
          </p>
        )}
      </DataTable>
    </div>
  );
}
