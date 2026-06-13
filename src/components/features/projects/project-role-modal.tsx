"use client";

import { useEffect, useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  CoordinatorPermissionsPicker,
  DEFAULT_COORDINATOR_PERMISSIONS,
  type CoordinatorPermissions,
} from "@/components/features/projects/coordinator-permissions";

type EligibleUser = { id: string; firstName: string; lastName: string; email: string };

type ProjectRoleModalProps = {
  projectId: string;
  coordinatorUsers: EligibleUser[];
  existingCoordinatorIds: string[];
};

export function ProjectRoleModal({
  projectId,
  coordinatorUsers,
  existingCoordinatorIds,
}: ProjectRoleModalProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [permissions, setPermissions] = useState<CoordinatorPermissions>(
    DEFAULT_COORDINATOR_PERMISSIONS
  );

  const available = coordinatorUsers.filter((u) => !existingCoordinatorIds.includes(u.id));

  useEffect(() => {
    if (!available.some((u) => u.id === userId)) {
      setUserId(available[0]?.id ?? "");
    }
  }, [available, userId]);

  function openModal() {
    setUserId(available[0]?.id ?? "");
    setPermissions(DEFAULT_COORDINATOR_PERMISSIONS);
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/projects/${projectId}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        role: "COORDINATOR",
        ...permissions,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        invalid_coordinator: "Le coordinateur doit être un client du projet.",
        trainer_on_session_only: "Les formateurs s'affectent sur les sessions.",
        duplicate: "Ce coordinateur est déjà assigné.",
      };
      setError(messages[data.error] || "Erreur lors de l'assignation.");
      return;
    }

    setOpen(false);
    refreshCurrentPath();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        <Button size="sm" className="shrink-0">
          <Plus className="h-4 w-4" />
          Ajouter un coordinateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un coordinateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <SelectField
            id="userId"
            label="Coordinateur client"
            value={userId}
            onChange={setUserId}
            options={
              available.length > 0
                ? available.map((u) => ({
                    value: u.id,
                    label: `${u.firstName} ${u.lastName} (${u.email})`,
                  }))
                : [{ value: "", label: "Aucun coordinateur disponible" }]
            }
            required
          />
          <div className="space-y-2">
            <Label>Habilitations</Label>
            <CoordinatorPermissionsPicker value={permissions} onChange={setPermissions} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !userId}>
              {loading ? "Assignation..." : "Assigner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
