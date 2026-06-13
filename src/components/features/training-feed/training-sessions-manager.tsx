"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSoftRefresh } from "@/hooks/use-soft-refresh";
import { Loader2, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LazyDeleteButton as DeleteButton } from "@/components/features/projects/lazy-modals";
import {
  FunctionalStatusSelect,
  LocationSelect,
  SessionDisplayBadge,
} from "@/components/features/training-feed/session-status-ui";
import {
  TrainerMultiSelect,
  isSessionScheduleReady,
  mergeBulkDraftConflicts,
  rowHasTrainerConflicts,
  useTrainerConflicts,
  type TrainerOption,
} from "@/components/features/training-feed/trainer-multi-select";
import { addMinutes, quarterHourTimeOptions, roundToQuarterHour } from "@/lib/calendar-time-grid";
import {
  CREATION_STATUSES,
  DISPLAY_STATUS_META,
  findNextConfirmedSessionId,
  getSessionDisplayStatus,
  getSessionRowClass,
  type FunctionalSessionStatus,
} from "@/lib/session-display";
import { formatDate, formatTime, toDateInputValue, toTimeInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

type Location = { id: string; name: string };

type SessionRow = {
  id: string;
  trainerIds: string[];
  locationId: string | null;
  startDatetime: string;
  endDatetime: string;
  status: string;
  location?: { id: string; name: string } | null;
  trainers?: { id: string; firstName: string; lastName: string }[];
};

type DraftRow = {
  key: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId: string;
  trainerIds: string[];
  status: FunctionalSessionStatus | "";
};

type SessionFormState = DraftRow & { id?: string };

type ProjectMeta = {
  companyName: string;
  projectName: string;
  programName: string;
};

const compactInput =
  "h-9 rounded-md border border-input bg-background px-2.5 text-[13px] outline-none focus:border-[#CD3465]/40 focus:ring-2 focus:ring-[#CD3465]/10";

const dateInput =
  "relative h-9 w-full min-w-0 rounded-md border border-input bg-background pl-2.5 pr-7 text-[13px] outline-none focus:border-[#CD3465]/40 focus:ring-2 focus:ring-[#CD3465]/10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-1.5 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer";

function emptyDraft(): DraftRow {
  const now = roundToQuarterHour(new Date());
  const end = addMinutes(now, 60);
  return {
    key: crypto.randomUUID(),
    date: toDateInputValue(now),
    startTime: toTimeInputValue(now),
    endTime: toTimeInputValue(end),
    locationId: "",
    trainerIds: [],
    status: "",
  };
}

function sessionToForm(session: SessionRow): SessionFormState {
  return {
    id: session.id,
    key: session.id,
    date: toDateInputValue(session.startDatetime),
    startTime: toTimeInputValue(session.startDatetime),
    endTime: toTimeInputValue(session.endDatetime),
    locationId: session.locationId ?? "",
    trainerIds: session.trainerIds ?? session.trainers?.map((t) => t.id) ?? [],
    status: session.status as FunctionalSessionStatus,
  };
}

function buildPayload(form: SessionFormState) {
  return {
    trainerIds: form.trainerIds,
    locationId: form.locationId,
    startDatetime: new Date(`${form.date}T${form.startTime}:00`).toISOString(),
    endDatetime: new Date(`${form.date}T${form.endTime}:00`).toISOString(),
    status: form.status,
  };
}

const TIME_OPTIONS = quarterHourTimeOptions(0, 24);

function addOneHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + 60;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function slotKey(date: string, startTime: string, endTime: string) {
  return `${date}|${startTime}|${endTime}`;
}

function findDuplicateSlot(
  row: DraftRow,
  existingSessions: SessionRow[],
  bulkRows: DraftRow[]
) {
  const key = slotKey(row.date, row.startTime, row.endTime);
  if (
    existingSessions.some(
      (s) =>
        slotKey(
          toDateInputValue(s.startDatetime),
          toTimeInputValue(s.startDatetime),
          toTimeInputValue(s.endDatetime)
        ) === key
    )
  ) {
    return true;
  }
  return bulkRows.filter(
    (r) => r.key !== row.key && slotKey(r.date, r.startTime, r.endTime) === key
  ).length > 0;
}

function formatTrainerList(trainers: { firstName: string; lastName: string }[]) {
  if (trainers.length === 0) return "Sans formateur";
  return trainers.map((t) => `${t.firstName} ${t.lastName}`).join(", ");
}

function CompactSessionFields({
  form,
  setForm,
  trainers,
  locations,
  trainingId,
  trainingTitle,
  projectMeta,
  bulkRows,
  showStatus = false,
  allowCancelled = false,
  externalConflicts,
}: {
  form: SessionFormState;
  setForm: (next: SessionFormState) => void;
  trainers: TrainerOption[];
  locations: Location[];
  trainingId: string;
  trainingTitle: string;
  projectMeta: ProjectMeta;
  bulkRows?: DraftRow[];
  showStatus?: boolean;
  allowCancelled?: boolean;
  externalConflicts?: Record<string, import("@/lib/session-conflicts-types").TrainerConflictInfo[]>;
}) {
  const scheduleReady = isSessionScheduleReady(form);
  const { conflicts: serverConflicts } = useTrainerConflicts(
    trainingId,
    form,
    scheduleReady && !externalConflicts,
    form.id
  );

  const conflicts = useMemo(() => {
    if (externalConflicts) return externalConflicts;
    const allTrainerIds = trainers.map((t) => t.id);
    if (!bulkRows) {
      return serverConflicts;
    }
    return mergeBulkDraftConflicts(
      serverConflicts,
      allTrainerIds,
      form.key,
      bulkRows,
      locations,
      trainingTitle,
      projectMeta
    );
  }, [
    externalConflicts,
    serverConflicts,
    bulkRows,
    form.key,
    trainers,
    locations,
    trainingTitle,
    projectMeta,
  ]);

  return (
    <div className="space-y-2 overflow-visible">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-[19%] min-w-[7.75rem] shrink-0">
          <Input
            type="date"
            aria-label="Date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={dateInput}
          />
        </div>
        <select
          aria-label="Début"
          required
          value={form.startTime}
          onChange={(e) => {
            const startTime = e.target.value;
            setForm({ ...form, startTime, endTime: addOneHour(startTime) });
          }}
          className={cn(compactInput, "w-[4.85rem] shrink-0 cursor-pointer px-1")}
        >
          {TIME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Fin"
          required
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          className={cn(compactInput, "w-[4.85rem] shrink-0 cursor-pointer px-1")}
        >
          {TIME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <LocationSelect
          value={form.locationId}
          onChange={(locationId) => setForm({ ...form, locationId })}
          locations={locations}
          className="min-w-[7.5rem]"
        />
        <FunctionalStatusSelect
          value={form.status}
          onChange={(status) => setForm({ ...form, status })}
          allowCancelled={allowCancelled && showStatus}
          className="min-w-[9rem] shrink-0"
        />
      </div>

      <TrainerMultiSelect
        trainers={trainers}
        value={form.trainerIds}
        onChange={(trainerIds) => setForm({ ...form, trainerIds })}
        enabled={scheduleReady}
        conflicts={conflicts}
      />
    </div>
  );
}

function BulkDraftRow({
  row,
  bulkRows,
  setBulkRows,
  trainers,
  locations,
  trainingId,
  trainingTitle,
  projectMeta,
  existingSessions,
  onClearRowError,
  apiError,
}: {
  row: DraftRow;
  bulkRows: DraftRow[];
  setBulkRows: React.Dispatch<React.SetStateAction<DraftRow[]>>;
  trainers: TrainerOption[];
  locations: Location[];
  trainingId: string;
  trainingTitle: string;
  projectMeta: ProjectMeta;
  existingSessions: SessionRow[];
  onClearRowError?: (key: string) => void;
  apiError?: string;
}) {
  const scheduleReady = isSessionScheduleReady(row);
  const { conflicts: serverConflicts } = useTrainerConflicts(
    trainingId,
    row,
    scheduleReady
  );
  const conflicts = useMemo(
    () =>
      mergeBulkDraftConflicts(
        serverConflicts,
        trainers.map((t) => t.id),
        row.key,
        bulkRows,
        locations,
        trainingTitle,
        projectMeta
      ),
    [serverConflicts, trainers, row.key, bulkRows, locations, trainingTitle, projectMeta]
  );
  const hasWarning = rowHasTrainerConflicts(row.trainerIds, conflicts);
  const hasDuplicate =
    isSessionScheduleReady(row) && findDuplicateSlot(row, existingSessions, bulkRows);
  const showDuplicateError = hasDuplicate || Boolean(apiError);

  return (
    <div
      className={cn(
        "overflow-visible rounded-md border px-2.5 py-2",
        showDuplicateError
          ? "border-red-300 bg-red-50/80 ring-1 ring-red-200"
          : hasWarning
            ? "border-amber-300 bg-amber-50/50 ring-1 ring-amber-200/90"
            : "border-neutral-300/90 bg-white shadow-sm"
      )}
    >
      {bulkRows.length > 1 && (
        <div className="mb-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => setBulkRows((rows) => rows.filter((r) => r.key !== row.key))}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <CompactSessionFields
        form={row}
        setForm={(next) => {
          setBulkRows((rows) => rows.map((r) => (r.key === row.key ? next : r)));
          onClearRowError?.(row.key);
        }}
        trainers={trainers}
        locations={locations}
        trainingId={trainingId}
        trainingTitle={trainingTitle}
        projectMeta={projectMeta}
        bulkRows={bulkRows}
        externalConflicts={conflicts}
      />
      {showDuplicateError && (
        <p className="mt-1.5 text-[12px] font-medium text-red-700">
          {apiError ?? "Un créneau sur les mêmes horaires existe déjà"}
        </p>
      )}
    </div>
  );
}

type TrainingSessionsManagerProps = {
  trainingId: string;
  trainingTitle: string;
  projectMeta: ProjectMeta;
  trainers: TrainerOption[];
  locations: Location[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function TrainingSessionsManager({
  trainingId,
  trainingTitle,
  projectMeta,
  trainers,
  locations,
  trigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: TrainingSessionsManagerProps) {
  const { refresh } = useSoftRefresh();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [bulkRows, setBulkRows] = useState<DraftRow[]>([emptyDraft()]);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SessionFormState | null>(null);

  const nextSessionId = useMemo(() => findNextConfirmedSessionId(sessions), [sessions]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/trainings/${trainingId}/sessions`);
    setLoading(false);
    if (!res.ok) return;
    const data = (await res.json()) as SessionRow[];
    setSessions(data);
  }, [trainingId]);

  useEffect(() => {
    if (open) void loadSessions();
  }, [open, loadSessions]);

  async function handleBulkCreate() {
    const invalid = bulkRows.some((row) => !isSessionScheduleReady(row));
    const missingStatus = bulkRows.some(
      (row) => !CREATION_STATUSES.includes(row.status as (typeof CREATION_STATUSES)[number])
    );
    if (invalid) {
      setError("Complétez date, horaires et lieu pour chaque session.");
      return;
    }
    if (missingStatus) {
      setError("Choisissez un statut (Confirmée ou À confirmer) pour chaque session.");
      return;
    }

    const duplicateErrors: Record<string, string> = {};
    bulkRows.forEach((row) => {
      if (findDuplicateSlot(row, sessions, bulkRows)) {
        duplicateErrors[row.key] = "Un créneau sur les mêmes horaires existe déjà";
      }
    });
    if (Object.keys(duplicateErrors).length > 0) {
      setRowErrors(duplicateErrors);
      setError("");
      return;
    }

    setSaving(true);
    setError("");
    setRowErrors({});
    const res = await fetch(`/api/trainings/${trainingId}/sessions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessions: bulkRows.map((row) => ({
          trainerIds: row.trainerIds,
          locationId: row.locationId,
          date: row.date,
          startTime: row.startTime,
          endTime: row.endTime,
          status: row.status,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        index?: number;
      } | null;
      if (data?.error === "duplicate_slot" && typeof data.index === "number") {
        const row = bulkRows[data.index];
        if (row) {
          setRowErrors({ [row.key]: "Un créneau sur les mêmes horaires existe déjà" });
        }
        setError("");
        return;
      }
      setError(
        data?.error === "invalid_input"
          ? "Données invalides. Vérifiez date, horaires, lieu et statut."
          : "Erreur lors de la création des sessions."
      );
      return;
    }
    setBulkRows([emptyDraft()]);
    setRowErrors({});
    await loadSessions();
  }

  async function handleSaveEdit() {
    if (!editForm?.id || !isSessionScheduleReady(editForm) || !editForm.status) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/trainings/${trainingId}/sessions/${editForm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(editForm)),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Erreur lors de la mise à jour.");
      return;
    }
    setEditingId(null);
    setEditForm(null);
    await loadSessions();
    refresh(`/trainings/${trainingId}`);
  }

  function startEdit(session: SessionRow) {
    setEditingId(session.id);
    setEditForm(sessionToForm(session));
  }

  const contextLine = [
    trainingTitle,
    projectMeta.programName,
    projectMeta.projectName,
    projectMeta.companyName,
  ]
    .filter(Boolean)
    .join(" · ");

  function clearRowError(key: string) {
    setRowErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-[12px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Gérer les sessions
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        hideCloseButton
        className="fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none sm:rounded-none"
      >
        <header className="shrink-0 border-b bg-background px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-col justify-center">
              <h2 className="text-xl font-semibold tracking-tight">Gérer les sessions</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{contextLine}</p>
            </div>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 shrink-0 px-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </Button>
            </DialogClose>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-4 py-5 sm:px-6">
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-300 bg-neutral-100/90">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-300/80 px-4 py-3">
              <h3 className="text-[14px] font-semibold">Ajouter de nouvelles sessions</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-neutral-300 bg-white px-2.5 text-[12px]"
                onClick={() => setBulkRows((rows) => [...rows, emptyDraft()])}
              >
                <Plus className="h-3.5 w-3.5" />
                Ligne
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {bulkRows.map((row) => (
                  <BulkDraftRow
                    key={row.key}
                    row={row}
                    bulkRows={bulkRows}
                    setBulkRows={setBulkRows}
                    trainers={trainers}
                    locations={locations}
                    trainingId={trainingId}
                    trainingTitle={trainingTitle}
                    projectMeta={projectMeta}
                    existingSessions={sessions}
                    onClearRowError={clearRowError}
                    apiError={rowErrors[row.key]}
                  />
                ))}
              </div>
            </div>
            <div className="shrink-0 border-t border-neutral-300/80 p-3">
              {error && <p className="mb-2 text-[13px] text-destructive">{error}</p>}
              <Button
                type="button"
                size="sm"
                className="h-9 w-full text-[13px]"
                disabled={saving}
                onClick={handleBulkCreate}
              >
                {saving
                  ? "Création..."
                  : `Créer ${bulkRows.length} session${bulkRows.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </section>

          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-muted/10">
            <div className="shrink-0 border-b px-4 py-3">
              <h3 className="text-[14px] font-semibold">
                Sessions planifiées ({sessions.length})
              </h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-8 text-center text-[13px] text-muted-foreground">
                  Aucune session pour cette formation.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {sessions.map((session) => {
                    const displayStatus = getSessionDisplayStatus(session, {
                      staffView: true,
                      nextSessionId,
                    });
                    const statusMeta = displayStatus ? DISPLAY_STATUS_META[displayStatus] : null;
                    const rowClass = getSessionRowClass(session, {
                      staffView: true,
                      nextSessionId,
                    });

                    if (editingId === session.id && editForm) {
                      return (
                        <div key={session.id} className="overflow-visible rounded-md border bg-white px-2.5 py-2">
                          <CompactSessionFields
                            form={editForm}
                            setForm={setEditForm}
                            trainers={trainers}
                            locations={locations}
                            trainingId={trainingId}
                            trainingTitle={trainingTitle}
                            projectMeta={projectMeta}
                            showStatus
                            allowCancelled
                          />
                          <div className="mt-2 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-7"
                              disabled={saving}
                              onClick={handleSaveEdit}
                            >
                              Enregistrer
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7"
                              onClick={() => {
                                setEditingId(null);
                                setEditForm(null);
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md border px-2.5 py-2",
                          rowClass
                        )}
                      >
                        <div className="min-w-0 flex-1 text-[13px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-medium">
                              {formatDate(session.startDatetime)} ·{" "}
                              {formatTime(session.startDatetime)} –{" "}
                              {formatTime(session.endDatetime)}
                            </p>
                            {statusMeta && (
                              <SessionDisplayBadge
                                label={statusMeta.label}
                                badgeClass={statusMeta.badge}
                                icon={statusMeta.icon}
                              />
                            )}
                          </div>
                          <p className="mt-0.5 text-muted-foreground">
                            {session.location?.name ?? "Lieu non défini"}
                            {" · "}
                            {formatTrainerList(session.trainers ?? [])}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => startEdit(session)}
                            aria-label="Modifier la session"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <DeleteButton
                            url={`/api/trainings/${trainingId}/sessions/${session.id}`}
                            onDeleted={() => {
                              void loadSessions();
                              refresh(`/trainings/${trainingId}`);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
