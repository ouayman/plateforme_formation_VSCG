"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate, formatTime, toTimeInputValue } from "@/lib/format";
import {
  addMinutes,
  quarterHourTimeOptions,
  SLOT_MINUTES,
  startOfDay,
} from "@/lib/calendar-time-grid";
import {
  addMonths,
  formatMonthYear,
  getMonthGrid,
  isSameDay,
  startOfMonth,
  WEEKDAY_LABELS,
} from "@/lib/calendar-month";
import { getWeekDays, startOfWeek, toDateKey } from "@/lib/calendar-week";
import type { UnavailabilityRow } from "@/components/features/admin/trainer-unavailability-modal";
import { useOptionalTrainerPlanning } from "@/components/features/planning/trainer-planning-context";

type ScheduleSession = {
  id: string;
  trainingId: string;
  startDatetime: string;
  endDatetime: string;
  trainingTitle: string;
  projectId: string;
  projectName: string;
  companyName: string;
};

type TrainerScheduleCalendarProps = {
  sessions: ScheduleSession[];
  initialUnavailabilities: UnavailabilityRow[];
  editable?: boolean;
  showUnavailabilityLegend?: boolean;
};

type CalendarView = "month" | "week" | "day";

type BlockInteraction =
  | {
      kind: "create";
      day: Date;
      anchor: number;
      current: number;
    }
  | {
      kind: "move";
      blockId: string;
      day: Date;
      anchor: number;
      current: number;
      origStart: Date;
      origEnd: Date;
      moved: boolean;
    }
  | {
      kind: "resize-top";
      blockId: string;
      day: Date;
      anchor: number;
      current: number;
      origEnd: Date;
    }
  | {
      kind: "resize-bottom";
      blockId: string;
      day: Date;
      anchor: number;
      current: number;
      origStart: Date;
    };

const START_HOUR = 7;
const END_HOUR = 21;
const SLOT_PX = 14;
const TIME_OPTIONS = quarterHourTimeOptions(START_HOUR, END_HOUR + 1);

function slotIndex(date: Date) {
  const dayStart = startOfDay(date);
  const minutes = (date.getTime() - dayStart.getTime()) / 60_000;
  return Math.floor((minutes - START_HOUR * 60) / SLOT_MINUTES);
}

function dateFromSlot(day: Date, index: number) {
  const d = startOfDay(day);
  d.setHours(START_HOUR, 0, 0, 0);
  return addMinutes(d, index * SLOT_MINUTES);
}

function blockStyle(start: Date, end: Date, day: Date) {
  const startIdx = Math.max(0, slotIndex(start));
  const endIdx = Math.min((END_HOUR - START_HOUR) * (60 / SLOT_MINUTES), slotIndex(end));
  const top = startIdx * SLOT_PX;
  const height = Math.max(SLOT_PX, (endIdx - startIdx) * SLOT_PX);
  if (end <= startOfDay(day) || start >= addMinutes(startOfDay(day), (END_HOUR - START_HOUR) * 60)) {
    return null;
  }
  return { top, height, startIdx, endIdx };
}

function slotBorderClass(index: number) {
  if (index % 4 === 0) return "border-neutral-400";
  if (index % 2 === 0) return "border-neutral-200";
  return "border-neutral-100";
}

function indexFromClientY(clientY: number, columnTop: number, slotsPerDay: number) {
  return Math.max(0, Math.min(slotsPerDay - 1, Math.floor((clientY - columnTop) / SLOT_PX)));
}

function ScheduleLegend({ showUnavailability }: { showUnavailability: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-3 w-7 shrink-0 rounded-sm bg-blue-500" />
        Mes sessions de formations
      </span>
      {showUnavailability && (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-7 shrink-0 rounded-sm bg-red-500/90" />
          Mes indisponibilités
        </span>
      )}
    </div>
  );
}

export function TrainerScheduleCalendar({
  sessions,
  initialUnavailabilities,
  editable = true,
  showUnavailabilityLegend = false,
}: TrainerScheduleCalendarProps) {
  const planningCtx = useOptionalTrainerPlanning();
  const addMode = editable && (planningCtx?.addMode ?? false);

  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [unavailabilities, setUnavailabilities] = useState(initialUnavailabilities);
  const [previewCreate, setPreviewCreate] = useState<{ dayKey: string; a: number; b: number } | null>(
    null
  );
  const [previewBlock, setPreviewBlock] = useState<{
    dayKey: string;
    top: number;
    height: number;
  } | null>(null);
  const [editingBlock, setEditingBlock] = useState<UnavailabilityRow | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const interactionRef = useRef<BlockInteraction | null>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const monthStart = useMemo(() => startOfMonth(anchor), [anchor]);
  const monthGrid = useMemo(() => getMonthGrid(monthStart), [monthStart]);
  const dayAnchor = useMemo(() => startOfDay(anchor), [anchor]);

  const slotsPerDay = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

  const refreshUnavailabilities = useCallback(async () => {
    const res = await fetch("/api/me/unavailabilities");
    if (res.ok) setUnavailabilities(await res.json());
  }, []);

  async function createUnavailability(start: Date, end: Date) {
    if (end <= start) return;
    const res = await fetch("/api/me/unavailabilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
      }),
    });
    if (res.ok) await refreshUnavailabilities();
  }

  async function updateUnavailability(id: string, start: Date, end: Date) {
    if (end <= start) return false;
    const res = await fetch(`/api/me/unavailabilities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
      }),
    });
    if (res.ok) {
      await refreshUnavailabilities();
      return true;
    }
    return false;
  }

  async function deleteUnavailability(id: string) {
    await fetch(`/api/me/unavailabilities/${id}`, { method: "DELETE" });
    await refreshUnavailabilities();
  }

  const resolveInteraction = useCallback(
    async (interaction: BlockInteraction) => {
      if (interaction.kind === "create") {
        const a = Math.min(interaction.anchor, interaction.current);
        const b = Math.max(interaction.anchor, interaction.current) + 1;
        const start = dateFromSlot(interaction.day, a);
        const end = dateFromSlot(interaction.day, b);
        await createUnavailability(start, end);
        return;
      }

      const block = unavailabilities.find((u) => u.id === interaction.blockId);
      if (!block) return;

      if (interaction.kind === "move") {
        if (!interaction.moved) {
          openEditModal(block);
          return;
        }
        const delta = interaction.current - interaction.anchor;
        const duration = slotIndex(new Date(block.endDatetime)) - slotIndex(new Date(block.startDatetime));
        const newStartIdx = Math.max(0, slotIndex(new Date(block.startDatetime)) + delta);
        const newEndIdx = Math.min(slotsPerDay, newStartIdx + duration);
        const start = dateFromSlot(interaction.day, newStartIdx);
        const end = dateFromSlot(interaction.day, newEndIdx);
        await updateUnavailability(block.id, start, end);
        return;
      }

      if (interaction.kind === "resize-top") {
        const a = Math.min(interaction.current, slotIndex(interaction.origEnd) - 1);
        const end = new Date(block.endDatetime);
        const start = dateFromSlot(interaction.day, a);
        await updateUnavailability(block.id, start, end);
        return;
      }

      if (interaction.kind === "resize-bottom") {
        const b = Math.max(interaction.current + 1, slotIndex(interaction.origStart) + 1);
        const start = new Date(block.startDatetime);
        const end = dateFromSlot(interaction.day, b);
        await updateUnavailability(block.id, start, end);
      }
    },
    [slotsPerDay, unavailabilities]
  );

  const finishInteraction = useCallback(async () => {
    const interaction = interactionRef.current;
    interactionRef.current = null;
    setPreviewCreate(null);
    setPreviewBlock(null);
    if (!interaction) return;
    await resolveInteraction(interaction);
  }, [resolveInteraction]);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const interaction = interactionRef.current;
      if (!interaction) return;

      const column = columnRefs.current.get(toDateKey(interaction.day));
      if (!column) return;

      const rect = column.getBoundingClientRect();
      const index = indexFromClientY(e.clientY, rect.top, slotsPerDay);

      if (interaction.kind === "create") {
        interaction.current = index;
        const a = Math.min(interaction.anchor, interaction.current);
        const b = Math.max(interaction.anchor, interaction.current);
        setPreviewCreate({ dayKey: toDateKey(interaction.day), a, b });
        return;
      }

      interaction.current = index;
      if (interaction.kind === "move") {
        if (index !== interaction.anchor) interaction.moved = true;
      }

      const block = unavailabilities.find((u) => u.id === interaction.blockId);
      if (!block) return;

      let top = 0;
      let height = SLOT_PX;
      if (interaction.kind === "move" && interaction.moved) {
        const duration =
          slotIndex(new Date(block.endDatetime)) - slotIndex(new Date(block.startDatetime));
        const newStartIdx = Math.max(0, slotIndex(new Date(block.startDatetime)) + (index - interaction.anchor));
        top = newStartIdx * SLOT_PX;
        height = Math.max(SLOT_PX, duration * SLOT_PX);
      } else if (interaction.kind === "resize-top") {
        const endIdx = slotIndex(new Date(interaction.origEnd));
        const a = Math.min(index, endIdx - 1);
        top = a * SLOT_PX;
        height = Math.max(SLOT_PX, (endIdx - a) * SLOT_PX);
      } else if (interaction.kind === "resize-bottom") {
        const startIdx = slotIndex(new Date(interaction.origStart));
        const b = Math.max(index + 1, startIdx + 1);
        top = startIdx * SLOT_PX;
        height = Math.max(SLOT_PX, (b - startIdx) * SLOT_PX);
      }

      setPreviewBlock({ dayKey: toDateKey(interaction.day), top, height });
    }

    function onPointerUp() {
      if (interactionRef.current) void finishInteraction();
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [finishInteraction, slotsPerDay, unavailabilities]);

  function startCreateDrag(e: React.PointerEvent, day: Date) {
    if (!addMode) return;
    if ((e.target as HTMLElement).closest("a,[data-unavailability-block]")) return;
    e.preventDefault();
    const column = columnRefs.current.get(toDateKey(day));
    if (!column) return;
    const rect = column.getBoundingClientRect();
    const index = indexFromClientY(e.clientY, rect.top, slotsPerDay);
    interactionRef.current = { kind: "create", day, anchor: index, current: index };
    setPreviewCreate({ dayKey: toDateKey(day), a: index, b: index });
    column.setPointerCapture(e.pointerId);
  }

  function startBlockInteraction(
    e: React.PointerEvent,
    block: UnavailabilityRow,
    day: Date,
    kind: "move" | "resize-top" | "resize-bottom"
  ) {
    if (!editable || addMode) return;
    e.stopPropagation();
    e.preventDefault();
    const column = columnRefs.current.get(toDateKey(day));
    if (!column) return;
    const rect = column.getBoundingClientRect();
    const index = indexFromClientY(e.clientY, rect.top, slotsPerDay);
    const origStart = new Date(block.startDatetime);
    const origEnd = new Date(block.endDatetime);

    if (kind === "move") {
      interactionRef.current = {
        kind: "move",
        blockId: block.id,
        day,
        anchor: index,
        current: index,
        origStart,
        origEnd,
        moved: false,
      };
    } else if (kind === "resize-top") {
      interactionRef.current = {
        kind: "resize-top",
        blockId: block.id,
        day,
        anchor: index,
        current: index,
        origEnd,
      };
    } else {
      interactionRef.current = {
        kind: "resize-bottom",
        blockId: block.id,
        day,
        anchor: index,
        current: index,
        origStart,
      };
    }
    column.setPointerCapture(e.pointerId);
  }

  function openEditModal(block: UnavailabilityRow) {
    setEditingBlock(block);
    setEditStartTime(toTimeInputValue(block.startDatetime));
    setEditEndTime(toTimeInputValue(block.endDatetime));
  }

  async function handleSaveEdit() {
    if (!editingBlock) return;
    const dayKey = toDateKey(editingBlock.startDatetime);
    const start = new Date(`${dayKey}T${editStartTime}:00`);
    const end = new Date(`${dayKey}T${editEndTime}:00`);
    if (end <= start) return;

    setSavingEdit(true);
    const ok = await updateUnavailability(editingBlock.id, start, end);
    setSavingEdit(false);
    if (ok) setEditingBlock(null);
  }

  function renderTimeGrid(days: Date[]) {
    return (
      <div className="overflow-x-auto">
        <div
          className={cn(
            "rounded-lg border border-neutral-400",
            addMode && "ring-2 ring-red-300/80"
          )}
        >
          <div
            className="grid min-w-[640px]"
            style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}
          >
            <div className="border-b border-neutral-400 bg-muted/20" />
            {days.map((day) => (
              <div
                key={toDateKey(day)}
                className="border-b border-l border-neutral-400 bg-muted/20 px-1 py-1.5 text-center text-[12px] font-semibold"
              >
                {day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}
              </div>
            ))}

            <div className="relative border-r border-neutral-400 text-[11px] text-muted-foreground">
              {Array.from({ length: slotsPerDay }, (_, i) => (
                <div
                  key={i}
                  className={cn("border-b pr-1 text-right", slotBorderClass(i))}
                  style={{ height: SLOT_PX, lineHeight: i % 4 === 0 ? `${SLOT_PX}px` : undefined }}
                >
                  {i % 4 === 0 ? formatTime(dateFromSlot(days[0], i)) : null}
                </div>
              ))}
            </div>

            {days.map((day) => {
              const dayKey = toDateKey(day);
              const daySessions = sessions.filter((s) => toDateKey(s.startDatetime) === dayKey);
              const dayUnavail = unavailabilities.filter(
                (u) =>
                  new Date(u.startDatetime) <
                    addMinutes(startOfDay(day), (END_HOUR - START_HOUR) * 60 + START_HOUR * 60) &&
                  new Date(u.endDatetime) > startOfDay(day)
              );

              return (
                <div
                  key={dayKey}
                  ref={(el) => {
                    if (el) columnRefs.current.set(dayKey, el);
                    else columnRefs.current.delete(dayKey);
                  }}
                  className={cn(
                    "relative touch-none border-l border-neutral-400 bg-white",
                    addMode && "cursor-cell"
                  )}
                  style={{ height: slotsPerDay * SLOT_PX }}
                  onPointerDown={(e) => startCreateDrag(e, day)}
                >
                  {Array.from({ length: slotsPerDay }, (_, i) => {
                    const selected =
                      previewCreate &&
                      previewCreate.dayKey === dayKey &&
                      i >= previewCreate.a &&
                      i <= previewCreate.b;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "pointer-events-none absolute left-0 right-0 border-b",
                          slotBorderClass(i),
                          selected && "bg-red-200/90"
                        )}
                        style={{ top: i * SLOT_PX, height: SLOT_PX }}
                      />
                    );
                  })}

                  {previewBlock && previewBlock.dayKey === dayKey && (
                    <div
                      className="pointer-events-none absolute left-0.5 right-0.5 z-30 rounded border border-red-700/50 bg-red-400/70"
                      style={{ top: previewBlock.top, height: previewBlock.height }}
                    />
                  )}

                  {daySessions.map((session) => {
                    const style = blockStyle(
                      new Date(session.startDatetime),
                      new Date(session.endDatetime),
                      day
                    );
                    if (!style) return null;
                    return (
                      <Link
                        key={session.id}
                        href={`/trainings/${session.trainingId}`}
                        className="absolute left-0.5 right-0.5 z-10 block overflow-hidden rounded border border-blue-300 bg-blue-50 px-1.5 py-1 text-[10px] leading-snug text-blue-950 shadow-sm transition hover:bg-blue-100"
                        style={{ top: style.top, height: style.height, minHeight: SLOT_PX * 2 }}
                      >
                        <p className="whitespace-normal font-semibold">{session.trainingTitle}</p>
                        <p className="mt-0.5 whitespace-normal text-blue-800/80">{session.companyName}</p>
                        <p className="mt-0.5 font-medium text-blue-900/90">
                          {formatTime(session.startDatetime)} – {formatTime(session.endDatetime)}
                        </p>
                      </Link>
                    );
                  })}

                  {dayUnavail.map((block) => {
                    const style = blockStyle(
                      new Date(block.startDatetime),
                      new Date(block.endDatetime),
                      day
                    );
                    if (!style) return null;
                    if (
                      previewBlock?.dayKey === dayKey &&
                      interactionRef.current &&
                      interactionRef.current.kind !== "create" &&
                      interactionRef.current.blockId === block.id
                    ) {
                      return null;
                    }
                    const startLabel = formatTime(block.startDatetime);
                    const endLabel = formatTime(block.endDatetime);
                    return (
                      <div
                        key={block.id}
                        data-unavailability-block
                        className="absolute left-0.5 right-0.5 z-20 overflow-hidden rounded border border-red-700/40 bg-red-500/90 text-[10px] font-semibold leading-tight text-white"
                        style={{ top: style.top, height: style.height, minHeight: SLOT_PX }}
                      >
                        <div
                          className="absolute inset-x-0 top-0 z-10 h-2 cursor-ns-resize"
                          onPointerDown={(e) => startBlockInteraction(e, block, day, "resize-top")}
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 z-10 h-2 cursor-ns-resize"
                          onPointerDown={(e) => startBlockInteraction(e, block, day, "resize-bottom")}
                        />
                        <div
                          className="absolute inset-x-0 top-2 bottom-2 flex cursor-grab items-center px-1 active:cursor-grabbing"
                          onPointerDown={(e) => startBlockInteraction(e, block, day, "move")}
                        >
                          <span>
                            {startLabel} – {endLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-2 px-1 text-[12px] text-muted-foreground">
          {editable && addMode
            ? "Glissez sur la grille pour bloquer un créneau (pas de 15 min). Cliquez une zone rouge pour modifier, ou glissez pour déplacer / redimensionner."
            : editable
              ? "Activez « Ajouter mes indisponibilités » pour bloquer un créneau."
              : "Vue lecture seule des sessions planifiées."}
        </p>
      </div>
    );
  }

  const monthMarkers = useMemo(() => {
    const map = new Map<string, { sessions: number; unavail: number }>();
    for (const s of sessions) {
      const k = toDateKey(s.startDatetime);
      const cur = map.get(k) ?? { sessions: 0, unavail: 0 };
      map.set(k, { ...cur, sessions: cur.sessions + 1 });
    }
    for (const u of unavailabilities) {
      let d = startOfDay(new Date(u.startDatetime));
      const end = new Date(u.endDatetime);
      while (d <= end) {
        const k = toDateKey(d);
        const cur = map.get(k) ?? { sessions: 0, unavail: 0 };
        map.set(k, { ...cur, unavail: cur.unavail + 1 });
        d = addMinutes(d, 24 * 60);
      }
    }
    return map;
  }, [sessions, unavailabilities]);

  const periodLabel =
    view === "month"
      ? formatMonthYear(monthStart)
      : view === "week"
        ? `Semaine du ${formatDate(weekStart)}`
        : formatDate(dayAnchor);

  return (
    <div className="space-y-4 px-2 pb-4 pt-3">
      <div className="grid grid-cols-1 items-center gap-3 px-2 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-1 justify-self-start">
          <button
            type="button"
            aria-label="Période précédente"
            onClick={() => {
              if (view === "month") setAnchor((d) => addMonths(d, -1));
              else if (view === "week") setAnchor((d) => addMinutes(d, -7 * 24 * 60));
              else setAnchor((d) => addMinutes(d, -24 * 60));
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-400 hover:bg-black/[0.04]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Période suivante"
            onClick={() => {
              if (view === "month") setAnchor((d) => addMonths(d, 1));
              else if (view === "week") setAnchor((d) => addMinutes(d, 7 * 24 * 60));
              else setAnchor((d) => addMinutes(d, 24 * 60));
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-400 hover:bg-black/[0.04]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="ml-2 text-[14px] font-semibold">{periodLabel}</p>
        </div>

        <div className="justify-self-center">
          <ScheduleLegend showUnavailability={showUnavailabilityLegend} />
        </div>

        <div className="flex justify-self-end gap-1 rounded-xl border border-neutral-200 bg-muted/50 p-1">
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize",
                view === v ? "bg-white shadow-sm" : "text-muted-foreground"
              )}
            >
              {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
            </button>
          ))}
        </div>
      </div>

      {addMode && editable && view !== "month" && (
        <div className="mx-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-800">
          Mode ajout actif — sélectionnez un créneau sur la grille (semaine ou jour).
        </div>
      )}

      {view === "month" && (
        <div className="px-2">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAY_LABELS.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthGrid.map(({ date, inMonth }) => {
              const markers = monthMarkers.get(toDateKey(date));
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    setAnchor(date);
                    setView("day");
                  }}
                  className={cn(
                    "min-h-[72px] rounded-lg border border-neutral-400 p-1 text-left text-[11px] transition hover:border-primary/40",
                    !inMonth && "opacity-40",
                    isSameDay(date, new Date()) && "border-primary ring-1 ring-primary/20"
                  )}
                >
                  <span className="font-semibold">{date.getDate()}</span>
                  <div className="mt-1 space-y-0.5">
                    {(markers?.sessions ?? 0) > 0 && (
                      <span className="block truncate text-[10px] text-blue-700">
                        {markers!.sessions} session{(markers!.sessions > 1 && "s") || ""}
                      </span>
                    )}
                    {showUnavailabilityLegend && (markers?.unavail ?? 0) > 0 && (
                      <span className="block h-1.5 rounded bg-red-500/90" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && renderTimeGrid(weekDays)}
      {view === "day" && renderTimeGrid([dayAnchor])}

      <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;indisponibilité</DialogTitle>
          </DialogHeader>
          {editingBlock && (
            <div className="space-y-3">
              <p className="text-[13px] text-muted-foreground">
                {formatDate(editingBlock.startDatetime)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-medium" htmlFor="unavail-start">
                    Début
                  </label>
                  <select
                    id="unavail-start"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-md border border-input bg-background px-2 text-[13px]"
                  >
                    {TIME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium" htmlFor="unavail-end">
                    Fin
                  </label>
                  <select
                    id="unavail-end"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-md border border-input bg-background px-2 text-[13px]"
                  >
                    {TIME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              disabled={savingEdit || !editingBlock}
              onClick={async () => {
                if (!editingBlock) return;
                if (!confirm("Supprimer cette indisponibilité ?")) return;
                await deleteUnavailability(editingBlock.id);
                setEditingBlock(null);
              }}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Supprimer
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingBlock(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={savingEdit || editEndTime <= editStartTime}
                onClick={() => void handleSaveEdit()}
              >
                Enregistrer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
