"use client";

import { useRouter } from "next/navigation";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type CompanyOption = { id: string; name: string };

type CompanySwitcherProps = {
  companies: CompanyOption[];
  activeCompanyId: string;
};

export function CompanySwitcher({ companies, activeCompanyId }: CompanySwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = companies.find((c) => c.id === activeCompanyId) ?? companies[0];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (companies.length <= 1) return null;

  async function selectCompany(companyId: string) {
    if (companyId === activeCompanyId || loading) return;
    setLoading(true);
    await fetch("/api/account/active-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative mb-3 px-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
      >
        <Building2 className="h-4 w-4 shrink-0 text-[#CD3465]" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-white">
          {active?.name ?? "Entreprise"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/40 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute left-3 right-3 top-[calc(100%+4px)] z-20 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#111827] py-1 shadow-2xl">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => selectCompany(company.id)}
              className={cn(
                "block w-full truncate px-3 py-2 text-left text-[12px] transition hover:bg-white/5",
                company.id === activeCompanyId
                  ? "font-semibold text-[#CD3465]"
                  : "text-white/75"
              )}
            >
              {company.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
