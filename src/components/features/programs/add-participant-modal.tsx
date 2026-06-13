"use client";

import { useMemo, useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";

type TrainingOption = { id: string; title: string };

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; fieldsReadOnly: boolean; alreadyInProgram: boolean }
  | { status: "new" };

type AddParticipantModalProps = {
  programId: string;
  trainings: TrainingOption[];
};

export function AddParticipantModal({ programId, trainings }: AddParticipantModalProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<string[]>([]);
  const [allTrainings, setAllTrainings] = useState(false);

  const allSelected = useMemo(
    () => trainings.length > 0 && selectedTrainingIds.length === trainings.length,
    [selectedTrainingIds.length, trainings.length]
  );

  function resetForm() {
    setEmail("");
    setFirstName("");
    setLastName("");
    setLookup({ status: "idle" });
    setSelectedTrainingIds([]);
    setAllTrainings(false);
    setError("");
  }

  async function handleEmailLookup() {
    const value = email.trim();
    if (!value) return;

    setLookup({ status: "loading" });
    setError("");

    const res = await fetch(
      `/api/programs/${programId}/participants/lookup?email=${encodeURIComponent(value)}`
    );

    if (!res.ok) {
      setLookup({ status: "idle" });
      setError("Impossible de vérifier cette adresse email.");
      return;
    }

    const data = await res.json();

    if (data.found) {
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setLookup({
        status: "ready",
        fieldsReadOnly: data.fieldsReadOnly,
        alreadyInProgram: data.alreadyInProgram,
      });
    } else {
      setFirstName("");
      setLastName("");
      setLookup({ status: "new" });
    }
  }

  function toggleAllTrainings() {
    if (allTrainings || allSelected) {
      setAllTrainings(false);
      setSelectedTrainingIds([]);
    } else {
      setAllTrainings(true);
      setSelectedTrainingIds(trainings.map((t) => t.id));
    }
  }

  function toggleTraining(trainingId: string) {
    setAllTrainings(false);
    setSelectedTrainingIds((prev) =>
      prev.includes(trainingId)
        ? prev.filter((id) => id !== trainingId)
        : [...prev, trainingId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lookup.status === "idle") return;

    setLoading(true);
    setError("");

    const res = await fetch(`/api/programs/${programId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        trainingIds: selectedTrainingIds,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const code = (await res.json().catch(() => ({}))).error;
      if (code === "email_unavailable") {
        setError("Cette adresse email est déjà utilisée et inaccessible depuis votre périmètre.");
      } else {
        setError("Erreur lors de l'ajout du participant.");
      }
      return;
    }

    setOpen(false);
    resetForm();
    refreshCurrentPath();
  }

  const showIdentityFields = lookup.status === "ready" || lookup.status === "new";
  const fieldsReadOnly = lookup.status === "ready" && lookup.fieldsReadOnly;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Ajouter un participant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un participant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="participant-email">Adresse email</Label>
            <div className="flex gap-2">
              <Input
                id="participant-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLookup({ status: "idle" });
                  setFirstName("");
                  setLastName("");
                }}
                onBlur={handleEmailLookup}
                placeholder="prenom.nom@entreprise.com"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!email.trim() || lookup.status === "loading"}
                onClick={handleEmailLookup}
              >
                {lookup.status === "loading" ? "..." : "Vérifier"}
              </Button>
            </div>
          </div>

          {showIdentityFields && (
            <>
              {lookup.status === "ready" && lookup.alreadyInProgram && (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[13px] text-amber-800">
                  Ce participant est déjà inscrit au programme. Les formations sélectionnées
                  seront ajoutées à son parcours.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="participant-firstName">Prénom</Label>
                  <Input
                    id="participant-firstName"
                    required
                    readOnly={fieldsReadOnly}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={cn(fieldsReadOnly && "bg-muted/50")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participant-lastName">Nom</Label>
                  <Input
                    id="participant-lastName"
                    required
                    readOnly={fieldsReadOnly}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={cn(fieldsReadOnly && "bg-muted/50")}
                  />
                </div>
              </div>

              {fieldsReadOnly && (
                <p className="text-[12px] text-muted-foreground">
                  Identité en lecture seule — participant rattaché à une autre entreprise du
                  groupement.
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Affectation aux formations</Label>
                  {trainings.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllTrainings}
                      className="text-[12px] font-medium text-[#CD3465] hover:underline"
                    >
                      {allSelected ? "Tout désélectionner" : "Affecter à toutes les formations"}
                    </button>
                  )}
                </div>

                {trainings.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    Aucune formation dans ce programme pour le moment.
                  </p>
                ) : (
                  <ul className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-surface p-3">
                    {trainings.map((training) => (
                      <li key={training.id}>
                        <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                          <input
                            type="checkbox"
                            checked={selectedTrainingIds.includes(training.id)}
                            onChange={() => toggleTraining(training.id)}
                            className="rounded border-gray-300"
                          />
                          {training.title}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !showIdentityFields}>
              {loading ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
