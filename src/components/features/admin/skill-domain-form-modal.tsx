"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

type SkillDomain = { id: string; name: string };

type SkillDomainFormModalProps = {
  domain?: SkillDomain;
  trigger?: React.ReactNode;
};

export function SkillDomainFormModal({ domain, trigger }: SkillDomainFormModalProps) {
  const router = useRouter();
  const isEdit = !!domain;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(domain?.name ?? "");

  function openModal() {
    setName(domain?.name ?? "");
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(
      isEdit ? `/api/admin/skill-domains/${domain!.id}` : "/api/admin/skill-domains",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      }
    );

    setLoading(false);
    if (!res.ok) {
      setError(
        (await res.json().catch(() => ({}))).error === "duplicate"
          ? "Ce domaine existe déjà."
          : "Erreur lors de l'enregistrement."
      );
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!domain) return;
    if (!confirm(`Supprimer ${domain.name} ?`)) return;

    setDeleting(true);
    setError("");
    const res = await fetch(`/api/admin/skill-domains/${domain.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setError("Erreur lors de la suppression.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouveau domaine de compétence
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le domaine de compétence" : "Nouveau domaine de compétence"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="domain-name">Nom</Label>
            <Input
              id="domain-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Lean, Agile, Leadership..."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className={isEdit ? "sm:justify-between" : undefined}>
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={loading || deleting}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || deleting || !name.trim()}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SkillDomainEditButton({ domain }: { domain: SkillDomain }) {
  return (
    <SkillDomainFormModal
      domain={domain}
      trigger={
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-[12px]">
          <Pencil className="h-3.5 w-3.5" />
          Modifier le domaine de compétence
        </Button>
      }
    />
  );
}
