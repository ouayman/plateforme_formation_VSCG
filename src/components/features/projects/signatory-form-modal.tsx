"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignatureInput } from "@/components/ui/signature-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Signatory = {
  id: string;
  name: string;
  title: string;
  signatureImageUrl: string;
};

type SignatoryFormModalProps = {
  projectId: string;
  signatory?: Signatory;
  trigger?: React.ReactNode;
};

export function SignatoryFormModal({
  projectId,
  signatory,
  trigger,
}: SignatoryFormModalProps) {
  const router = useRouter();
  const isEdit = !!signatory;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: signatory?.name ?? "",
    title: signatory?.title ?? "",
    signatureImageUrl: signatory?.signatureImageUrl ?? "",
  });

  function openModal() {
    if (signatory) {
      setForm({
        name: signatory.name,
        title: signatory.title,
        signatureImageUrl: signatory.signatureImageUrl,
      });
    } else {
      setForm({ name: "", title: "", signatureImageUrl: "" });
    }
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit
      ? `/api/projects/${projectId}/signatories/${signatory.id}`
      : `/api/projects/${projectId}/signatories`;

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }

    setOpen(false);
    if (!isEdit) setForm({ name: "", title: "", signatureImageUrl: "" });
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le signataire" : "Nouveau signataire"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="sig-name">Nom</Label>
            <Input
              id="sig-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Fonction</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <SignatureInput
            projectId={projectId}
            value={form.signatureImageUrl}
            onChange={(signatureImageUrl) => setForm({ ...form, signatureImageUrl })}
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

export function SignatoryEditButton({
  projectId,
  signatory,
}: {
  projectId: string;
  signatory: Signatory;
}) {
  return (
    <SignatoryFormModal
      projectId={projectId}
      signatory={signatory}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
