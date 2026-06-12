"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import {
  CREATION_STATUSES,
  FUNCTIONAL_STATUSES,
  FUNCTIONAL_STATUS_META,
  type FunctionalSessionStatus,
} from "@/lib/session-display";
import { cn } from "@/lib/utils";

export function SessionDisplayBadge({
  label,
  badgeClass,
  icon: Icon,
  className,
}: {
  label: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
        badgeClass,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

export function FunctionalStatusPicker({
  value,
  onChange,
  allowCancelled = false,
  compact = false,
}: {
  value: string;
  onChange: (status: FunctionalSessionStatus) => void;
  allowCancelled?: boolean;
  compact?: boolean;
}) {
  const options = allowCancelled ? FUNCTIONAL_STATUSES : CREATION_STATUSES;

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>
      {options.map((status) => {
        const meta = FUNCTIONAL_STATUS_META[status];
        const active = value === status;
        const Icon = meta.icon;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition",
              active ? meta.activeBadge : meta.badge,
              compact && "px-1.5 py-0.5"
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

export function FunctionalStatusSelect({
  value,
  onChange,
  allowCancelled = false,
  className,
}: {
  value: string;
  onChange: (status: FunctionalSessionStatus) => void;
  allowCancelled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = allowCancelled ? FUNCTIONAL_STATUSES : CREATION_STATUSES;
  const selected = (options as readonly string[]).includes(value)
    ? (value as FunctionalSessionStatus)
    : null;
  const selectedMeta = selected ? FUNCTIONAL_STATUS_META[selected] : null;
  const SelectedIcon = selectedMeta?.icon;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative min-w-[9rem] shrink-0", className)}>
      <button
        type="button"
        aria-label="Statut"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center gap-1.5 rounded-md border px-2.5 text-left text-[13px] font-semibold outline-none transition focus:border-[#CD3465]/40 focus:ring-2 focus:ring-[#CD3465]/10",
          selectedMeta?.activeBadge ?? "border-input bg-background text-muted-foreground"
        )}
      >
        {SelectedIcon ? (
          <SelectedIcon className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <span className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate">{selectedMeta?.label ?? "Statut…"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 opacity-70", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-[250] min-w-full overflow-hidden rounded-md border border-neutral-200 bg-white p-1 shadow-lg">
          {options.map((status) => {
            const meta = FUNCTIONAL_STATUS_META[status];
            const Icon = meta.icon;
            const active = value === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onChange(status);
                  setOpen(false);
                }}
                className={cn(
                  "mb-0.5 flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[12px] font-semibold transition last:mb-0",
                  active ? meta.activeBadge : meta.badge
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LocationSelect({
  value,
  onChange,
  locations,
  className,
}: {
  value: string;
  onChange: (locationId: string) => void;
  locations: { id: string; name: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = locations.find((l) => l.id === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative min-w-[8rem] flex-1", className)}>
      <button
        type="button"
        aria-label="Lieu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center gap-1.5 rounded-md border px-2.5 text-left text-[13px] outline-none transition focus:border-[#CD3465]/40 focus:ring-2 focus:ring-[#CD3465]/10",
          selected
            ? "border-input bg-background font-medium text-foreground"
            : "border-input bg-background text-muted-foreground"
        )}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{selected?.name ?? "Lieu…"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 opacity-70", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[250] max-h-48 overflow-y-auto rounded-md border border-neutral-200 bg-white p-1 shadow-lg">
          {locations.map((location) => {
            const active = value === location.id;
            return (
              <button
                key={location.id}
                type="button"
                onClick={() => {
                  onChange(location.id);
                  setOpen(false);
                }}
                className={cn(
                  "mb-0.5 flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[12px] transition last:mb-0",
                  active
                    ? "border-[#CD3465]/30 bg-[#CD3465]/5 font-semibold text-foreground"
                    : "border-transparent bg-background font-medium text-foreground hover:bg-muted/40"
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {location.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
