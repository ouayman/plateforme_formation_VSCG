"use client";

import { useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SkillDomainPicker } from "@/components/features/admin/skill-domain-picker";

type SkillDomainOption = { id: string; name: string };

type Trainer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  skillDomains: SkillDomainOption[];
};

type TrainerFormModalProps = {
  skillDomains: SkillDomainOption[];
  trainer?: Trainer;
  trigger?: React.ReactNode;
};

export function TrainerFormModal({ skillDomains, trainer, trigger }: TrainerFormModalProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const isEdit = !!trainer;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    skillDomainIds: [] as string[],
  });

  function openModal() {
    setForm({
      email: trainer?.email ?? "",
      firstName: trainer?.firstName ?? "",
      lastName: trainer?.lastName ?? "",
      phone: trainer?.phone ?? "",
      skillDomainIds: trainer?.skillDomains.map((d) => d.id) ?? [],
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.skillDomainIds.length === 0) {
      setError("Sélectionnez au moins un domaine.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(isEdit ? `/api/admin/trainers/${trainer!.id}` : "/api/admin/trainers", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        email_exists: "Cet email est déjà utilisé.",
        invalid_domains: "Domaines de compétence invalides.",
      };
      setError(messages[data.error] || "Erreur lors de l'enregistrement.");
      return;
    }

    setOpen(false);
    refreshCurrentPath();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouveau formateur
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le formateur" : "Nouveau formateur"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="trainer-email">Email</Label>
            <Input
              id="trainer-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trainer-firstName">Prénom</Label>
              <Input
                id="trainer-firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainer-lastName">Nom</Label>
              <Input
                id="trainer-lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trainer-phone">Téléphone</Label>
            <Input
              id="trainer-phone"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Domaines de compétence</Label>
            <SkillDomainPicker
              domains={skillDomains}
              value={form.skillDomainIds}
              onChange={(skillDomainIds) => setForm({ ...form, skillDomainIds })}
            />
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

export function TrainerEditButton({
  trainer,
  skillDomains,
}: {
  trainer: Trainer;
  skillDomains: SkillDomainOption[];
}) {
  return (
    <TrainerFormModal
      trainer={trainer}
      skillDomains={skillDomains}
      trigger={
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
