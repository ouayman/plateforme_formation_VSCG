"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type Training = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
};

type TrainingFormModalProps = {
  programId: string;
  training?: Training;
  trigger?: React.ReactNode;
  nextOrderIndex?: number;
};

export function TrainingFormModal({
  programId,
  training,
  trigger,
  nextOrderIndex = 0,
}: TrainingFormModalProps) {
  const router = useRouter();
  const { refreshCurrentPath } = usePathRefresh();
  const isEdit = !!training;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: training?.title ?? "",
    description: training?.description ?? "",
  });

  function openModal() {
    if (training) {
      setForm({
        title: training.title,
        description: training.description ?? "",
      });
    } else {
      setForm({ title: "", description: "" });
    }
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit
      ? `/api/programs/${programId}/trainings/${training.id}`
      : `/api/programs/${programId}/trainings`;

    const payload = isEdit
      ? { title: form.title, description: form.description }
      : { title: form.title, description: form.description, orderIndex: nextOrderIndex };

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
      const data = await res.json();
      router.push(`/trainings/${data.id}`);
    }
    refreshCurrentPath();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouvelle formation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la formation" : "Nouvelle formation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-xl border border-border/80 bg-white px-3.5 py-2 text-sm shadow-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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

export function TrainingEditButton({
  programId,
  training,
}: {
  programId: string;
  training: Training;
}) {
  return (
    <TrainingFormModal
      programId={programId}
      training={training}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
