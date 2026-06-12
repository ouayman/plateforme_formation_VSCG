"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TrainerOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type SkillDomainTrainersModalProps = {
  domainId: string;
  domainName: string;
  trainers: TrainerOption[];
  assignedTrainerIds: string[];
};

export function SkillDomainTrainersModal({
  domainId,
  domainName,
  trainers,
  assignedTrainerIds,
}: SkillDomainTrainersModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(assignedTrainerIds);

  function openModal() {
    setSelected(assignedTrainerIds);
    setSearch("");
    setError("");
    setOpen(true);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter((t) => {
      const haystack = `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [trainers, search]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/skill-domains/${domainId}/trainers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerIds: selected }),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-[12px]">
          <Users className="h-3.5 w-3.5" />
          Gérer les formateurs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Formateurs — {domainName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un formateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-[13px]"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {selected.length} formateur{selected.length !== 1 ? "s" : ""} assigné
            {selected.length !== 1 ? "s" : ""}
          </p>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-2">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-muted-foreground">
                Aucun formateur trouvé.
              </p>
            ) : (
              <div className="grid gap-1.5">
                {filtered.map((trainer) => {
                  const active = selected.includes(trainer.id);
                  return (
                    <button
                      key={trainer.id}
                      type="button"
                      onClick={() => toggle(trainer.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left transition-all",
                        active
                          ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200"
                          : "border-border bg-background hover:bg-muted/40"
                      )}
                    >
                      <p className="text-[13px] font-medium">
                        {trainer.firstName} {trainer.lastName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{trainer.email}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={loading} onClick={handleSave}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
