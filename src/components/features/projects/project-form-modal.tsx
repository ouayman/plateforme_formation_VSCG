"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanySearchPicker } from "@/components/features/projects/company-search-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toDateInputValue } from "@/lib/format";

type Company = { id: string; name: string };
type Project = {
  id: string;
  name: string;
  companyId: string;
  startDate: string;
  endDate: string;
  deletedAt?: string | null;
};

type ProjectFormModalProps = {
  companies: Company[];
  project?: Project;
  lockCompanyChange?: boolean;
  trigger?: React.ReactNode;
};

export function ProjectFormModal({
  companies,
  project,
  lockCompanyChange = false,
  trigger,
}: ProjectFormModalProps) {
  const router = useRouter();
  const isEdit = !!project;
  const isDeleted = !!project?.deletedAt;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: project?.name ?? "",
    companyId: project?.companyId ?? companies[0]?.id ?? "",
    startDate: project ? toDateInputValue(project.startDate) : "",
    endDate: project ? toDateInputValue(project.endDate) : "",
  });

  function openModal() {
    if (project) {
      setForm({
        name: project.name,
        companyId: project.companyId,
        startDate: toDateInputValue(project.startDate),
        endDate: toDateInputValue(project.endDate),
      });
    }
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDeleted) return;

    setLoading(true);
    setError("");

    const url = isEdit ? `/api/projects/${project.id}` : "/api/projects";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "company_locked") {
        setError("Le client ne peut pas être modifié tant qu'un coordinateur ou un signataire est affecté.");
      } else {
        setError("Erreur lors de l'enregistrement.");
      }
      return;
    }

    setOpen(false);
    router.refresh();
    if (!isEdit) {
      const data = await res.json();
      router.push(`/projects/${data.id}`);
    }
  }

  async function handleDelete() {
    if (!project || isDeleted) return;
    if (
      !confirm(
        `Supprimer le projet « ${project.name} » ?\n\nLe projet sera masqué mais restera accessible via « Afficher les projets supprimés ».`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setError("Erreur lors de la suppression.");
      return;
    }

    setOpen(false);
    router.push("/projects");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
        </DialogHeader>
        {isDeleted ? (
          <p className="text-sm text-muted-foreground">
            Ce projet a été supprimé et n&apos;est plus modifiable.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <CompanySearchPicker
              companies={companies}
              value={form.companyId}
              onChange={(companyId) => setForm({ ...form, companyId })}
              disabled={isEdit && lockCompanyChange}
              required
            />
            {isEdit && lockCompanyChange && (
              <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p>
                  Ce projet a au moins un coordinateur ou un signataire des attestations affecté.
                  Le client ne peut pas être modifié tant que ces affectations existent.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Début</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
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
                  {deleting ? "Suppression..." : "Supprimer le projet"}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading || deleting}>
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ProjectEditButton({
  companies,
  project,
  lockCompanyChange,
}: {
  companies: Company[];
  project: Project;
  lockCompanyChange?: boolean;
}) {
  return (
    <ProjectFormModal
      companies={companies}
      project={project}
      lockCompanyChange={lockCompanyChange}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
