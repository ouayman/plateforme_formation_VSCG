"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteButton } from "@/components/features/projects/delete-button";
import { formatDatetime, toDatetimeLocalValue } from "@/lib/format";

export type UnavailabilityRow = {
  id: string;
  startDatetime: string;
  endDatetime: string;
};

type TrainerUnavailabilityModalProps = {
  trainerId: string;
  trainerName: string;
};

function emptyForm() {
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  const end = new Date(start.getTime() + 60 * 60_000);
  return {
    startDatetime: toDatetimeLocalValue(start),
    endDatetime: toDatetimeLocalValue(end),
  };
}

export function TrainerUnavailabilityModal({
  trainerId,
  trainerName,
}: TrainerUnavailabilityModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<UnavailabilityRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/trainers/${trainerId}/unavailabilities`);
    setLoading(false);
    if (!res.ok) return;
    setRows(await res.json());
  }, [trainerId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function handleAdd() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/trainers/${trainerId}/unavailabilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDatetime: new Date(form.startDatetime).toISOString(),
        endDatetime: new Date(form.endDatetime).toISOString(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Créneau invalide.");
      return;
    }
    setForm(emptyForm());
    await load();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]">
          <CalendarOff className="h-3.5 w-3.5" />
          Indisponibilités
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Indisponibilités — {trainerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <p className="text-[12px] font-semibold">Ajouter un créneau</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-[11px]">
                <span className="text-muted-foreground">Début</span>
                <Input
                  type="datetime-local"
                  step={900}
                  value={form.startDatetime}
                  onChange={(e) => setForm({ ...form, startDatetime: e.target.value })}
                  className="h-8 text-[12px]"
                />
              </label>
              <label className="space-y-1 text-[11px]">
                <span className="text-muted-foreground">Fin</span>
                <Input
                  type="datetime-local"
                  step={900}
                  value={form.endDatetime}
                  onChange={(e) => setForm({ ...form, endDatetime: e.target.value })}
                  className="h-8 text-[12px]"
                />
              </label>
            </div>
            {error && <p className="text-[12px] text-destructive">{error}</p>}
            <Button type="button" size="sm" className="h-8" disabled={saving} onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-[13px] text-muted-foreground">Aucune indisponibilité.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-red-200/80 bg-red-50/60 px-3 py-2 text-[12px]"
                >
                  <span>
                    {formatDatetime(row.startDatetime)} → {formatDatetime(row.endDatetime)}
                  </span>
                  <DeleteButton
                    url={`/api/admin/trainers/${trainerId}/unavailabilities/${row.id}`}
                    confirmMessage="Supprimer ce créneau ?"
                    onDeleted={() => void load()}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TrainerUnavailabilityButton({
  trainerId,
  trainerName,
}: TrainerUnavailabilityModalProps) {
  return <TrainerUnavailabilityModal trainerId={trainerId} trainerName={trainerName} />;
}
