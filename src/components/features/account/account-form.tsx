"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProfileAvatarUpload } from "@/components/features/account/profile-avatar-upload";
import { GLOBAL_ROLE_LABELS, type GlobalRoleValue } from "@/lib/user-roles";
import { formatUserType } from "@/lib/user-types";

type AccountFormProps = {
  userId: string;
  initial: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    type: "internal" | "client";
    company: string;
    globalRoles: GlobalRoleValue[];
    projectRoles: { role: string }[];
  };
};

export function AccountForm({ userId, initial }: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    firstName: initial.firstName,
    lastName: initial.lastName,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Erreur lors de la mise à jour.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  const roleLabels = [
    ...initial.globalRoles.map((r) => GLOBAL_ROLE_LABELS[r]),
    ...initial.projectRoles.map((r) =>
      r.role === "COORDINATOR" ? "Coordinateur" : "Formateur projet"
    ),
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-3xl border bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
      >
        <div className="border-b bg-gradient-to-r from-[#CD3465]/10 via-transparent to-transparent px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CD3465]/10 text-[#CD3465]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Informations personnelles</h2>
              <p className="text-sm text-muted-foreground">Modifiez votre nom et prénom</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-8">
          <ProfileAvatarUpload
            userId={userId}
            firstName={form.firstName}
            lastName={form.lastName}
            initialAvatarUrl={initial.avatarUrl}
            uploadUrl="/api/account/avatar"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm font-medium text-emerald-600">Profil mis à jour avec succès.</p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Mail className="h-4 w-4 text-[#CD3465]" />
            Email
          </div>
          <p className="text-lg font-medium">{initial.email}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Non modifiable</p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-[#CD3465]" />
            Profil & rôles
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </p>
              <Badge variant="secondary" className="mt-1">
                {formatUserType(initial.type)}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Entreprise
              </p>
              <p className="mt-1 font-medium">{initial.company}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Rôles
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roleLabels.length > 0 ? (
                  roleLabels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Participant</Badge>
                )}
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">Non modifiables</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
