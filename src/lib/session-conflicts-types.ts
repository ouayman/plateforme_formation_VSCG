export type TrainerConflictKind = "session" | "unavailability";

export type TrainerConflictInfo = {
  kind: TrainerConflictKind;
  id: string;
  startDatetime: string;
  endDatetime: string;
  locationName?: string | null;
  companyName?: string;
  projectName?: string;
  programName?: string;
  trainingTitle?: string;
};

export function conflictLabel(kind: TrainerConflictKind) {
  return kind === "session"
    ? "Chevauchement avec autre formation"
    : "Indisponible sur le créneau";
}
