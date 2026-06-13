"use client";

import { useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Pencil, Plus } from "lucide-react";
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
import { toDatetimeLocalValue } from "@/lib/format";

type Trainer = { id: string; firstName: string; lastName: string };
type Location = { id: string; name: string };

type Session = {
  id: string;
  trainerId: string | null;
  locationId: string | null;
  startDatetime: string;
  endDatetime: string;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmée" },
  { value: "pending", label: "À confirmer" },
  { value: "cancelled", label: "Annulée" },
];

type SessionFormModalProps = {
  trainingId: string;
  trainers: Trainer[];
  locations: Location[];
  session?: Session;
  trigger?: React.ReactNode;
};

export function SessionFormModal({
  trainingId,
  trainers,
  locations,
  session,
  trigger,
}: SessionFormModalProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const isEdit = !!session;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    trainerId: session?.trainerId ?? "",
    locationId: session?.locationId ?? "",
    startDatetime: session ? toDatetimeLocalValue(session.startDatetime) : "",
    endDatetime: session ? toDatetimeLocalValue(session.endDatetime) : "",
    status: session?.status ?? "pending",
  });

  function openModal() {
    if (session) {
      setForm({
        trainerId: session.trainerId ?? "",
        locationId: session.locationId ?? "",
        startDatetime: toDatetimeLocalValue(session.startDatetime),
        endDatetime: toDatetimeLocalValue(session.endDatetime),
        status: session.status,
      });
    }
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit
      ? `/api/trainings/${trainingId}/sessions/${session.id}`
      : `/api/trainings/${trainingId}/sessions`;

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
    refreshCurrentPath();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouvelle session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la session" : "Nouvelle session"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <SelectField
            id="trainerId"
            label="Formateur"
            value={form.trainerId}
            onChange={(v) => setForm({ ...form, trainerId: v })}
            options={[
              { value: "", label: "— Non assigné —" },
              ...trainers.map((t) => ({
                value: t.id,
                label: `${t.firstName} ${t.lastName}`,
              })),
            ]}
          />
          <SelectField
            id="locationId"
            label="Lieu"
            value={form.locationId}
            onChange={(v) => setForm({ ...form, locationId: v })}
            options={[
              { value: "", label: "— Non défini —" },
              ...locations.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
          <div className="space-y-2">
            <Label htmlFor="startDatetime">Début</Label>
            <Input
              id="startDatetime"
              type="datetime-local"
              required
              value={form.startDatetime}
              onChange={(e) => setForm({ ...form, startDatetime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDatetime">Fin</Label>
            <Input
              id="endDatetime"
              type="datetime-local"
              required
              value={form.endDatetime}
              onChange={(e) => setForm({ ...form, endDatetime: e.target.value })}
            />
          </div>
          {isEdit && (
            <SelectField
              id="status"
              label="Statut"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={STATUS_OPTIONS}
            />
          )}
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

export function SessionEditButton({
  trainingId,
  trainers,
  locations,
  session,
}: {
  trainingId: string;
  trainers: Trainer[];
  locations: Location[];
  session: Session;
}) {
  return (
    <SessionFormModal
      trainingId={trainingId}
      trainers={trainers}
      locations={locations}
      session={session}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
