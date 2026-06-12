"use client";

import { useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DropdownPortal } from "@/components/ui/dropdown-portal";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };

type CompanySearchPickerProps = {
  id?: string;
  label?: string;
  companies: CompanyOption[];
  value: string;
  onChange: (companyId: string) => void;
  disabled?: boolean;
  required?: boolean;
};

export function CompanySearchPicker({
  id = "companyId",
  label = "Client",
  companies,
  value,
  onChange,
  disabled = false,
  required,
}: CompanySearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = companies.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, search]);

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={disabled ? "text-muted-foreground" : undefined}>
          {label}
        </Label>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setSearch("");
        }}
        className={cn(
          "flex min-h-9 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-[13px] transition",
          !disabled && "hover:border-[#CD3465]/30 hover:bg-muted/30",
          open && !disabled && "border-[#CD3465]/40 ring-2 ring-[#CD3465]/10",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <Building2 className="h-4 w-4 shrink-0 text-[#CD3465]" />
        <span className="min-w-0 flex-1 truncate">{selected?.name ?? "— Sélectionner —"}</span>
        {!disabled && (
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        )}
      </button>

      <DropdownPortal
        open={open && !disabled}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        matchWidth
        className="overflow-hidden rounded-xl border border-border/80 bg-background shadow-lg"
      >
        <div className="border-b border-border/60 p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-[12px]"
              autoFocus
            />
          </div>
        </div>
        <ul className="max-h-52 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-[12px] text-muted-foreground">
              Aucun client trouvé.
            </li>
          ) : (
            filtered.map((company) => {
              const active = company.id === value;
              return (
                <li key={company.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(company.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition hover:bg-muted/50",
                      active && "bg-[#CD3465]/5 font-medium text-[#CD3465]"
                    )}
                  >
                    <Check
                      className={cn("h-3.5 w-3.5 shrink-0", active ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{company.name}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </DropdownPortal>
    </div>
  );
}
