"use client";

import { useMemo, useState } from "react";
import { Building2, Mail, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  LazyDeleteButton as DeleteButton,
  LazyInviteUserModal as InviteUserModal,
  LazyUserEditModal as UserEditModal,
} from "@/components/features/admin/lazy-modals";
import { UserRolesBadges } from "@/components/features/admin/user-roles-badges";
import { countLabel } from "@/lib/format";
import { GLOBAL_ROLES } from "@/lib/user-roles";
import { formatUserType } from "@/lib/user-types";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  companyId: string;
  type: "internal" | "client";
  loginCount: number;
  company: { id: string; name: string; type: string; logoUrl?: string | null };
  globalRoles: ("ADMIN" | "PLANNER" | "TRAINER")[];
};

type Company = { id: string; name: string; type: string };

function FilterGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-secondary bg-secondary text-white shadow-sm"
          : "border-transparent bg-muted/50 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

type UsersAdminTableProps = {
  users: UserRow[];
  clientCompanies: Company[];
  internalCompanyId: string;
  organizationName: string;
  currentUserId: string;
};

export function UsersAdminTable({
  users,
  clientCompanies,
  internalCompanyId,
  organizationName,
  currentUserId,
}: UsersAdminTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "internal" | "client">("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<"all" | (typeof GLOBAL_ROLES)[number]>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (typeFilter !== "all" && user.type !== typeFilter) return false;
      if (companyFilter !== "all" && user.companyId !== companyFilter) return false;
      if (roleFilter !== "all" && !user.globalRoles.includes(roleFilter)) return false;
      if (!q) return true;
      const companyName = user.type === "internal" ? organizationName : user.company.name;
      const haystack =
        `${user.firstName} ${user.lastName} ${user.email} ${companyName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search, typeFilter, companyFilter, roleFilter, organizationName]);

  return (
    <div className="space-y-4">
      <div className="surface-panel overflow-hidden p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <InviteUserModal
            clientCompanies={clientCompanies}
            internalCompanyId={internalCompanyId}
          />
        </div>

        <div className="mt-4 grid gap-3 border-t border-border/40 pt-4 lg:grid-cols-[auto_1fr_auto] lg:items-start">
          <FilterGroup label="Type">
            {(
              [
                { value: "all", label: "Tous" },
                { value: "internal", label: "VSCG" },
                { value: "client", label: "Client" },
              ] as const
            ).map(({ value, label }) => (
              <FilterPill
                key={value}
                active={typeFilter === value}
                onClick={() => setTypeFilter(value)}
              >
                {label}
              </FilterPill>
            ))}
          </FilterGroup>

          <FilterGroup label="Rôle">
            {(
              [
                { value: "all", label: "Tous" },
                ...GLOBAL_ROLES.map((r) => ({
                  value: r,
                  label: r === "TRAINER" ? "Formateur" : r.charAt(0) + r.slice(1).toLowerCase(),
                })),
              ] as const
            ).map(({ value, label }) => (
              <FilterPill
                key={value}
                active={roleFilter === value}
                onClick={() => setRoleFilter(value as typeof roleFilter)}
              >
                {label}
              </FilterPill>
            ))}
          </FilterGroup>

          <FilterGroup label="Entreprise client" className="lg:min-w-[200px]">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] shadow-sm"
            >
              <option value="all">Toutes</option>
              {clientCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FilterGroup>
        </div>
      </div>

      <DataTable countLabel={countLabel(filtered.length, "utilisateur", "utilisateurs")}>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Entreprise</th>
              <th>Type</th>
              <th>Rôles</th>
              <th>Connexions</th>
              <th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-xs font-semibold text-violet-700">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <span className="font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {user.type === "internal" ? organizationName : user.company.name}
                  </span>
                </td>
                <td>
                  <Badge variant={user.type === "internal" ? "secondary" : "outline"}>
                    {formatUserType(user.type)}
                  </Badge>
                </td>
                <td>
                  <UserRolesBadges
                    roles={user.globalRoles}
                    isInternal={user.type === "internal"}
                  />
                </td>
                <td className="font-medium text-muted-foreground">{user.loginCount}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <UserEditModal
                      user={{
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        avatarUrl: user.avatarUrl,
                        companyId: user.companyId,
                        type: user.type,
                        globalRoles: user.globalRoles,
                      }}
                      clientCompanies={clientCompanies}
                      internalCompanyId={internalCompanyId}
                      organizationName={organizationName}
                      isSelf={user.id === currentUserId}
                    />
                    {user.id !== currentUserId && (
                      <DeleteButton
                        url={`/api/users/${user.id}`}
                        confirmMessage={`Supprimer ${user.firstName} ${user.lastName} ?`}
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
            Aucun utilisateur ne correspond aux filtres.
          </p>
        )}
      </DataTable>
    </div>
  );
}
