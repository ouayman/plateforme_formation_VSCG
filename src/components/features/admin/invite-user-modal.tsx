"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { formatUserType } from "@/lib/user-types";

type Company = { id: string; name: string };

type InviteUserModalProps = {
  clientCompanies: Company[];
  internalCompanyId: string;
};

export function InviteUserModal({ clientCompanies, internalCompanyId }: InviteUserModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    companyId: clientCompanies[0]?.id ?? "",
    type: "internal" as "internal" | "client",
    admin: false,
    planner: false,
    trainer: false,
  });

  function resetForm() {
    setForm({
      email: "",
      firstName: "",
      lastName: "",
      companyId: clientCompanies[0]?.id ?? "",
      type: "internal",
      admin: false,
      planner: false,
      trainer: false,
    });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.type === "client" && !form.companyId) {
      setLoading(false);
      setError("Sélectionnez une entreprise cliente.");
      return;
    }

    const globalRoles: ("ADMIN" | "PLANNER" | "TRAINER")[] = [];
    if (form.admin) globalRoles.push("ADMIN");
    if (form.planner) globalRoles.push("PLANNER");
    if (form.trainer) globalRoles.push("TRAINER");

    const payload = {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      type: form.type,
      companyId: form.type === "internal" ? internalCompanyId : form.companyId,
      globalRoles,
    };

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      const messages: Record<string, string> = {
        email_exists: "Cet email existe déjà.",
        type_mismatch: "Type incompatible avec l'entreprise.",
        client_no_global_roles: "Pas de rôles globaux pour les clients.",
      };
      setError(messages[data.error] || "Erreur lors de l'invitation.");
      return;
    }

    setOpen(false);
    resetForm();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <SelectField
            id="type"
            label="Type de compte"
            value={form.type}
            onChange={(type) =>
              setForm({
                ...form,
                type: type as "internal" | "client",
                companyId: clientCompanies[0]?.id ?? "",
                admin: type === "client" ? false : form.admin,
                planner: type === "client" ? false : form.planner,
                trainer: type === "client" ? false : form.trainer,
              })
            }
            options={[
              { value: "internal", label: formatUserType("internal") },
              { value: "client", label: formatUserType("client") },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
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
          {form.type === "client" && (
            <SelectField
              id="companyId"
              label="Entreprise cliente"
              value={form.companyId}
              onChange={(companyId) => setForm({ ...form, companyId })}
              options={clientCompanies.map((c) => ({ value: c.id, label: c.name }))}
              required
            />
          )}
          {form.type === "internal" && (
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.admin}
                  onChange={(e) => setForm({ ...form, admin: e.target.checked })}
                />
                Admin
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.planner}
                  onChange={(e) => setForm({ ...form, planner: e.target.checked })}
                />
                Planner
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.trainer}
                  onChange={(e) => setForm({ ...form, trainer: e.target.checked })}
                />
                Formateur
              </label>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ajout..." : "Ajouter un utilisateur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
