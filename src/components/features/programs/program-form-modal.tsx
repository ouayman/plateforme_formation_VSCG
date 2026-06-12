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

type Program = {
  id: string;
  name: string;
  orderIndex: number;
};

type ProgramFormModalProps = {
  projectId: string;
  program?: Program;
  trigger?: React.ReactNode;
  nextOrderIndex?: number;
};

export function ProgramFormModal({
  projectId,
  program,
  trigger,
  nextOrderIndex = 0,
}: ProgramFormModalProps) {
  const router = useRouter();
  const isEdit = !!program;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(program?.name ?? "");

  function openModal() {
    setName(program?.name ?? "");
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit
      ? `/api/projects/${projectId}/programs/${program.id}`
      : `/api/projects/${projectId}/programs`;

    const payload = isEdit
      ? { name, orderIndex: program.orderIndex }
      : { name, orderIndex: nextOrderIndex };

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }

    setOpen(false);
    if (!isEdit) {
      setName("");
      const data = await res.json();
      router.push(`/projects/${projectId}/programs/${data.id}`);
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!program) return;
    if (!confirm(`Supprimer le programme « ${program.name} » ?`)) return;

    setDeleting(true);
    setError("");
    const res = await fetch(`/api/projects/${projectId}/programs/${program.id}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (!res.ok) {
      setError("Erreur lors de la suppression.");
      return;
    }

    setOpen(false);
    router.push(`/projects/${projectId}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouveau programme
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le programme" : "Nouveau programme"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={loading || deleting}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Suppression..." : "Supprimer"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || deleting}>
                {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProgramEditButton({
  projectId,
  program,
}: {
  projectId: string;
  program: Program;
}) {
  return (
    <ProgramFormModal
      projectId={projectId}
      program={program}
      trigger={
        <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 px-0">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
