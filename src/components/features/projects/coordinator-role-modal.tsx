"use client";

import { useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CoordinatorPermissionsPicker,
  type CoordinatorPermissions,
} from "@/components/features/projects/coordinator-permissions";

type CoordinatorRoleModalProps = {
  projectId: string;
  roleId: string;
  user: { firstName: string; lastName: string; email: string };
  permissions: CoordinatorPermissions;
};

export function CoordinatorRoleModal({
  projectId,
  roleId,
  user,
  permissions,
}: CoordinatorRoleModalProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CoordinatorPermissions>(permissions);

  function openModal() {
    setForm(permissions);
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/projects/${projectId}/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le coordinateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="space-y-2">
            <Label>Coordinateur</Label>
            <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Habilitations</Label>
            <CoordinatorPermissionsPicker value={form} onChange={setForm} />
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
