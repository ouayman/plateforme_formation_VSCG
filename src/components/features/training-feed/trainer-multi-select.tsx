"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Info, Search, X } from "lucide-react";
import {
  conflictLabel,
  type TrainerConflictInfo,
} from "@/lib/session-conflicts";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TrainerOption = { id: string; firstName: string; lastName: string };
export type { TrainerConflictInfo };

type TrainerMultiSelectProps = {
  trainers: TrainerOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  enabled: boolean;
  conflicts?: Record<string, TrainerConflictInfo[]>;
};

function trainerName(trainer: TrainerOption) {
  return `${trainer.firstName} ${trainer.lastName}`;
}

function ConflictInfoPopover({ conflicts }: { conflicts: TrainerConflictInfo[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function updatePosition() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }

  return (
    <span
      className="relative inline-flex shrink-0"
      onMouseEnter={() => {
        updatePosition();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={btnRef}
        type="button"
        className="rounded p-0.5 text-red-600 hover:bg-red-100"
        aria-label="Détails du conflit"
      >
        <Info className="h-3 w-3" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-white p-2.5 text-left text-[11px] shadow-xl"
            style={{ top: coords.top, left: coords.left }}
          >
            {conflicts.map((c) => (
              <span
                key={`${c.kind}-${c.id}`}
                className="block border-b border-border/40 py-1.5 first:pt-0 last:border-0 last:pb-0"
              >
                <span className="block font-semibold text-foreground">{conflictLabel(c.kind)}</span>
                <span className="mt-0.5 block text-muted-foreground">
                  {formatDate(c.startDatetime)} · {formatTime(c.startDatetime)} –{" "}
                  {formatTime(c.endDatetime)}
                </span>
                {c.kind === "session" && (
                  <>
                    <span className="block font-medium text-foreground">{c.trainingTitle}</span>
                    <span className="block text-muted-foreground">
                      {c.locationName ?? "Lieu non défini"}
                    </span>
                    <span className="block text-muted-foreground">
                      {c.companyName} · {c.projectName} · {c.programName}
                    </span>
                  </>
                )}
              </span>
            ))}
          </div>,
          document.body
        )}
    </span>
  );
}

function primaryConflictLabel(conflicts: TrainerConflictInfo[]) {
  if (conflicts.length === 0) return null;
  const hasSession = conflicts.some((c) => c.kind === "session");
  return conflictLabel(hasSession ? "session" : "unavailability");
}

function SelectedTag({
  trainer,
  busy,
  conflicts,
  onRemove,
}: {
  trainer: TrainerOption;
  busy: boolean;
  conflicts: TrainerConflictInfo[];
  onRemove: () => void;
}) {
  const label = primaryConflictLabel(conflicts);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        busy ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      <span className="truncate">{trainerName(trainer)}</span>
      {busy && label && (
        <>
          <span className="shrink-0 text-[9px] font-normal">{label}</span>
          <ConflictInfoPopover conflicts={conflicts} />
        </>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn("rounded p-0.5", busy ? "hover:bg-red-100" : "hover:bg-emerald-100")}
        aria-label={`Retirer ${trainerName(trainer)}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

export function TrainerMultiSelect({
  trainers,
  value,
  onChange,
  enabled,
  conflicts = {},
}: TrainerMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => trainers.filter((t) => value.includes(t.id)),
    [trainers, value]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter((t) => trainerName(t).toLowerCase().includes(q));
  }, [trainers, search]);

  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        role="button"
        tabIndex={enabled ? 0 : -1}
        onClick={() => enabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!enabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex min-h-8 w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left transition",
          enabled
            ? "cursor-pointer border-input bg-background hover:border-[#CD3465]/30"
            : "cursor-not-allowed border-dashed border-border/70 bg-muted/20 opacity-70",
          open && enabled && "border-[#CD3465]/40 ring-2 ring-[#CD3465]/10"
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {selected.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {enabled ? "Formateurs…" : "Renseignez date, horaires et lieu"}
            </span>
          ) : (
            selected.map((trainer) => {
              const busy = (conflicts[trainer.id]?.length ?? 0) > 0;
              return (
                <SelectedTag
                  key={trainer.id}
                  trainer={trainer}
                  busy={busy}
                  conflicts={conflicts[trainer.id] ?? []}
                  onRemove={() => toggle(trainer.id)}
                />
              );
            })
          )}
        </div>
        {enabled && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        )}
      </div>

      {open && enabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] overflow-hidden rounded-lg border border-border/80 bg-background shadow-lg">
          <div className="border-b border-border/60 p-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un formateur…"
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-[12px] outline-none focus:border-[#CD3465]/40 focus:ring-2 focus:ring-[#CD3465]/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-44 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[12px] text-muted-foreground">Aucun formateur.</li>
            ) : (
              filtered.map((trainer) => {
                const selectedItem = value.includes(trainer.id);
                const trainerConflicts = conflicts[trainer.id] ?? [];
                const busy = trainerConflicts.length > 0;
                const label = primaryConflictLabel(trainerConflicts);
                return (
                  <li key={trainer.id}>
                    <button
                      type="button"
                      onClick={() => toggle(trainer.id)}
                      className={cn(
                        "flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] transition hover:opacity-90",
                        busy
                          ? "bg-red-50/80 text-red-700"
                          : "bg-emerald-50/50 text-emerald-800",
                        selectedItem && "ring-1 ring-inset ring-black/10"
                      )}
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          selectedItem ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{trainerName(trainer)}</span>
                        {busy && label && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-normal">
                            {label}
                            <ConflictInfoPopover conflicts={trainerConflicts} />
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function isSessionScheduleReady(form: {
  date: string;
  startTime: string;
  endTime: string;
  locationId: string;
}) {
  if (!form.date || !form.startTime || !form.endTime || !form.locationId) return false;
  const start = new Date(`${form.date}T${form.startTime}:00`);
  const end = new Date(`${form.date}T${form.endTime}:00`);
  return end > start;
}

export function buildDatetimeRange(form: {
  date: string;
  startTime: string;
  endTime: string;
}) {
  return {
    start: new Date(`${form.date}T${form.startTime}:00`),
    end: new Date(`${form.date}T${form.endTime}:00`),
  };
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function rowHasTrainerConflicts(
  trainerIds: string[],
  conflicts: Record<string, TrainerConflictInfo[]>
) {
  return trainerIds.some((id) => (conflicts[id]?.length ?? 0) > 0);
}

export function mergeBulkDraftConflicts(
  serverConflicts: Record<string, TrainerConflictInfo[]>,
  trainerIds: string[],
  currentKey: string,
  bulkRows: {
    key: string;
    date: string;
    startTime: string;
    endTime: string;
    locationId: string;
    trainerIds: string[];
  }[],
  locations: { id: string; name: string }[],
  trainingTitle: string,
  projectMeta: { companyName: string; projectName: string; programName: string }
): Record<string, TrainerConflictInfo[]> {
  const merged: Record<string, TrainerConflictInfo[]> = {};
  for (const id of trainerIds) {
    merged[id] = [...(serverConflicts[id] ?? [])];
  }

  const current = bulkRows.find((r) => r.key === currentKey);
  if (!current || !isSessionScheduleReady(current)) return merged;

  const { start: curStart, end: curEnd } = buildDatetimeRange(current);

  for (const row of bulkRows) {
    if (row.key === currentKey || !isSessionScheduleReady(row)) continue;
    const { start, end } = buildDatetimeRange(row);
    if (!rangesOverlap(curStart, curEnd, start, end)) continue;
    const rowLocationName = locations.find((l) => l.id === row.locationId)?.name ?? null;

    for (const trainerId of row.trainerIds) {
      if (!trainerIds.includes(trainerId)) continue;
      const synthetic: TrainerConflictInfo = {
        kind: "session",
        id: `draft-${row.key}`,
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        locationName: rowLocationName,
        companyName: projectMeta.companyName,
        projectName: projectMeta.projectName,
        programName: projectMeta.programName,
        trainingTitle: `${trainingTitle} (brouillon)`,
      };
      if (!merged[trainerId]) merged[trainerId] = [];
      merged[trainerId].push(synthetic);
    }
  }

  return merged;
}

export function useTrainerConflicts(
  trainingId: string,
  form: { date: string; startTime: string; endTime: string },
  enabled: boolean,
  excludeSessionId?: string
) {
  const [conflicts, setConflicts] = useState<Record<string, TrainerConflictInfo[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setConflicts({});
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/trainings/${trainingId}/sessions/conflicts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        excludeSessionId,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return { conflicts: {} };
        return res.json();
      })
      .then((data) => setConflicts(data.conflicts ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [trainingId, form.date, form.startTime, form.endTime, enabled, excludeSessionId]);

  return { conflicts, loading };
}
