"use client";

import { useEffect, useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { AlertTriangle, Pencil, Shield, CalendarDays, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProfileAvatarUpload } from "@/components/features/account/profile-avatar-upload";
import { cn } from "@/lib/utils";
import { PASSWORD } from "@/lib/constants";
import {
  GLOBAL_ROLE_LABELS,
  type GlobalRoleValue,
} from "@/lib/user-roles";
import { formatUserType } from "@/lib/user-types";

type Company = { id: string; name: string };

type CoordinatorGroup = {
  companyId: string;
  companyName: string;
  projectCount: number;
};

const ROLE_OPTIONS: {
  key: GlobalRoleValue;
  label: string;
  description: string;
  icon: typeof Shield;
}[] = [
  {
    key: "ADMIN",
    label: GLOBAL_ROLE_LABELS.ADMIN,
    description: "Administration complète",
    icon: Shield,
  },
  {
    key: "PLANNER",
    label: GLOBAL_ROLE_LABELS.PLANNER,
    description: "Gestion des projets",
    icon: CalendarDays,
  },
  {
    key: "TRAINER",
    label: GLOBAL_ROLE_LABELS.TRAINER,
    description: "Animation des sessions",
    icon: GraduationCap,
  },
];

type UserEditModalProps = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    type: "internal" | "client";
    globalRoles: GlobalRoleValue[];
    avatarUrl?: string | null;
  };
  clientCompanies: Company[];
  internalCompanyId: string;
  organizationName: string;
  isSelf?: boolean;
};

export function UserEditModal({
  user,
  clientCompanies,
  internalCompanyId,
  organizationName,
  isSelf = false,
}: UserEditModalProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coordinatorGroups, setCoordinatorGroups] = useState<CoordinatorGroup[]>([]);
  const [form, setForm] = useState({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    companyId: user.companyId,
    type: user.type,
    globalRoles: [...user.globalRoles],
    newPassword: "",
  });

  function openModal() {
    setForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      type: user.type,
      globalRoles: [...user.globalRoles],
      newPassword: "",
    });
    setError("");
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    fetch(`/api/users/${user.id}/coordinator-summary`)
      .then((res) => (res.ok ? res.json() : { groups: [] }))
      .then((data) => setCoordinatorGroups(data.groups ?? []))
      .catch(() => setCoordinatorGroups([]));
  }, [open, user.id]);

  const revokedCoordinatorGroups =
    form.type === "client" && form.companyId !== user.companyId
      ? coordinatorGroups.filter((g) => g.companyId !== form.companyId)
      : [];

  function toggleRole(role: GlobalRoleValue) {
    setForm((prev) => {
      const has = prev.globalRoles.includes(role);
      const next = has
        ? prev.globalRoles.filter((r) => r !== role)
        : [...prev.globalRoles, role];

      if (isSelf && role === "ADMIN" && !next.includes("ADMIN")) {
        return prev;
      }

      return { ...prev, globalRoles: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        companyId: form.type === "internal" ? internalCompanyId : form.companyId,
        type: form.type,
        globalRoles: form.globalRoles,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        email_exists: "Cet email existe déjà.",
        type_mismatch: "Type incompatible avec l'entreprise.",
        client_no_global_roles: "Pas de rôles globaux pour les clients.",
        cannot_remove_own_admin: "Vous ne pouvez pas retirer votre propre rôle admin.",
      };
      setError(messages[data.error] || "Erreur lors de la modification.");
      return;
    }

    if (form.newPassword.trim()) {
      const pwRes = await fetch(`/api/users/${user.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: form.newPassword }),
      });

      if (!pwRes.ok) {
        const data = await pwRes.json().catch(() => ({}));
        setError(
          data.error === "too_short"
            ? `Le mot de passe doit contenir au moins ${PASSWORD.MIN_LENGTH} caractères.`
            : "Profil mis à jour, mais erreur sur le mot de passe."
        );
        return;
      }
    }

    setOpen(false);
    refreshCurrentPath();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <SelectField
            id="edit-type"
            label="Type de compte"
            value={form.type}
            onChange={(type) =>
              setForm({
                ...form,
                type: type as "internal" | "client",
                companyId:
                  type === "internal"
                    ? internalCompanyId
                    : clientCompanies[0]?.id ?? form.companyId,
                globalRoles: type === "client" ? [] : form.globalRoles,
              })
            }
            options={[
              { value: "internal", label: formatUserType("internal") },
              { value: "client", label: formatUserType("client") },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">Prénom</Label>
              <Input
                id="edit-firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Nom</Label>
              <Input
                id="edit-lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <ProfileAvatarUpload
            userId={user.id}
            firstName={form.firstName}
            lastName={form.lastName}
            initialAvatarUrl={user.avatarUrl}
            uploadUrl={`/api/users/${user.id}/avatar`}
          />
          {form.type === "client" ? (
            <SelectField
              id="edit-companyId"
              label="Entreprise cliente"
              value={form.companyId}
              onChange={(companyId) => setForm({ ...form, companyId })}
              options={clientCompanies.map((c) => ({ value: c.id, label: c.name }))}
              required
            />
          ) : (
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {organizationName}
              </p>
            </div>
          )}

          {revokedCoordinatorGroups.map((group) => (
            <div
              key={group.companyId}
              className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                Cet utilisateur est affecté en tant que Coordinateur à{" "}
                {group.projectCount} projet{group.projectCount > 1 ? "s" : ""} de formations de
                l&apos;entreprise {group.companyName}. Si vous lui changez d&apos;entreprise, ses
                droits de coordinateurs sur ces projets de formation seront révoqués.
              </p>
            </div>
          ))}

          {form.type === "internal" && (
            <div className="space-y-2">
              <Label>Rôles VSCG</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLE_OPTIONS.map(({ key, label, description, icon: Icon }) => {
                  const active = form.globalRoles.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleRole(key)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        active
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-muted/40"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mb-2 h-4 w-4",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-new-password">Nouveau mot de passe</Label>
            <Input
              id="edit-new-password"
              type="password"
              autoComplete="new-password"
              placeholder={`Optionnel — min. ${PASSWORD.MIN_LENGTH} caractères`}
              minLength={PASSWORD.MIN_LENGTH}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
            <p className="text-[12px] text-muted-foreground">
              Laissez vide pour ne pas modifier le mot de passe.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
