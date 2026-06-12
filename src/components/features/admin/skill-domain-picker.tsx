"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SkillDomainOption = { id: string; name: string };

type SkillDomainPickerProps = {
  domains: SkillDomainOption[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function SkillDomainPicker({ domains, value, onChange }: SkillDomainPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return domains;
    return domains.filter((d) => d.name.toLowerCase().includes(q));
  }, [domains, search]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  if (domains.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-[13px] text-muted-foreground">
        Créez d&apos;abord des domaines de compétence.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un domaine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-[13px]"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {value.length} sélectionné{value.length !== 1 ? "s" : ""} · {domains.length} domaine
        {domains.length !== 1 ? "s" : ""}
      </p>
      <div className="max-h-52 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-[12px] text-muted-foreground">Aucun résultat.</p>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {filtered.map((domain) => {
              const active = value.includes(domain.id);
              return (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => toggle(domain.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-left text-[12px] font-medium leading-snug transition-all",
                    active
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                      : "border-border bg-background hover:border-emerald-200 hover:bg-muted/40"
                  )}
                >
                  {domain.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
