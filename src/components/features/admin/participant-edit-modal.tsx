"use client";

import { useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { ProfileAvatarUpload } from "@/components/features/account/profile-avatar-upload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Company = { id: string; name: string };

type ParticipantEditModalProps = {
  participant: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    avatarUrl?: string | null;
  };
  clientCompanies: Company[];
};

export function ParticipantEditModal({ participant, clientCompanies }: ParticipantEditModalProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(participant);

  function openModal() {
    setForm(participant);
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/users/${participant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        companyId: form.companyId,
        type: "client",
        globalRoles: [],
      }),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Erreur lors de l'enregistrement.");
      return;
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le participant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <ProfileAvatarUpload
            userId={participant.id}
            firstName={form.firstName}
            lastName={form.lastName}
            initialAvatarUrl={participant.avatarUrl}
            uploadUrl={`/api/users/${participant.id}/avatar`}
          />
          <div className="space-y-2">
            <Label htmlFor="edit-participant-email">Email</Label>
            <Input
              id="edit-participant-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-participant-firstName">Prénom</Label>
              <Input
                id="edit-participant-firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-participant-lastName">Nom</Label>
              <Input
                id="edit-participant-lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <SelectField
            id="edit-participant-companyId"
            label="Entreprise cliente"
            value={form.companyId}
            onChange={(companyId) => setForm({ ...form, companyId })}
            options={clientCompanies.map((c) => ({ value: c.id, label: c.name }))}
            required
          />
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
