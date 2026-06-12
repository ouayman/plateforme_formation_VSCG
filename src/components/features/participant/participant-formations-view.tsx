"use client";

import Link from "next/link";
import {
  Award,
  Calendar,
  ChevronRight,
  FileText,
  GraduationCap,
  MapPin,
  Sparkles,
  Unlock,
} from "lucide-react";
import { countLabel, formatDate } from "@/lib/format";
import { participantRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type ParticipantFormationRow = {
  id: string;
  title: string;
  description: string | null;
  programName: string;
  projectName: string;
  projectId: string;
  sessionCount: number;
  documentCount: number;
  certificateStatus: "locked" | "unlocked" | null;
  hasFeedback: boolean;
  nextSessionDate: string | null;
  progressPercent: number;
  attendancePercent: number;
  attendedSessions: number;
  completedSessions: number;
};

type ParticipantFormationsViewProps = {
  firstName: string;
  trainings: ParticipantFormationRow[];
  upcomingSessions: {
    id: string;
    trainingId: string;
    trainingTitle: string;
    programName: string;
    projectId: string;
    startDatetime: string;
    locationName: string | null;
  }[];
};

function groupByProjectAndProgram(trainings: ParticipantFormationRow[]) {
  const projects = new Map<
    string,
    { projectName: string; programs: Map<string, ParticipantFormationRow[]> }
  >();

  for (const training of trainings) {
    if (!projects.has(training.projectId)) {
      projects.set(training.projectId, {
        projectName: training.projectName,
        programs: new Map(),
      });
    }
    const project = projects.get(training.projectId)!;
    if (!project.programs.has(training.programName)) {
      project.programs.set(training.programName, []);
    }
    project.programs.get(training.programName)!.push(training);
  }

  return Array.from(projects.entries())
    .sort(([, a], [, b]) => a.projectName.localeCompare(b.projectName, "fr"))
    .map(([projectId, { projectName, programs }]) => ({
      projectId,
      projectName,
      programs: Array.from(programs.entries())
        .sort(([a], [b]) => a.localeCompare(b, "fr"))
        .map(([programName, items]) => ({
          programName,
          trainings: items.sort((a, b) => a.title.localeCompare(b.title, "fr")),
        })),
    }));
}

function FormationCard({ training }: { training: ParticipantFormationRow }) {
  const ringCircumference = 2 * Math.PI * 15;
  const ringOffset = (training.progressPercent / 100) * ringCircumference;
  const hasDocuments = training.documentCount > 0;

  return (
    <Link
      href={participantRoutes.training(training.id)}
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="hero-banner-base relative flex min-h-[7.5rem] flex-col p-4">
        <div className="absolute inset-0 opacity-20">
          <Sparkles className="absolute right-3 top-3 h-12 w-12 text-white/30" />
        </div>
        <p className="relative z-10 line-clamp-3 text-[17px] font-semibold leading-snug text-white sm:text-[18px]">
          {training.title}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0">
            <svg className="h-11 w-11 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#CD3465"
                strokeWidth="3"
                strokeDasharray={`${ringOffset} ${ringCircumference}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
              {training.progressPercent}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-muted-foreground">
              {countLabel(training.completedSessions, "session terminée", "sessions terminées")} sur{" "}
              {training.sessionCount}
            </p>
            <p className="text-[12px] text-muted-foreground">
              Présence {training.attendancePercent}%
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px]",
              hasDocuments
                ? "bg-[#CD3465]/10 font-medium text-[#CD3465]"
                : "bg-black/[0.04] text-muted-foreground"
            )}
          >
            <FileText className="h-3 w-3" />
            {countLabel(training.documentCount, "document disponible", "documents disponibles")}
          </span>
          {training.certificateStatus === "unlocked" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <Unlock className="h-3 w-3" />
              Attestation disponible
            </span>
          )}
          {training.hasFeedback && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <Award className="h-3 w-3" />
              Avis soumis
            </span>
          )}
        </div>

        {training.nextSessionDate && (
          <p className="mt-3 text-[12px] text-muted-foreground">
            Prochaine · {formatDate(training.nextSessionDate)}
          </p>
        )}

        <div className="mt-auto border-t border-surface pt-3">
          <span className="flex items-center justify-center gap-1 rounded-md bg-black/[0.04] py-2.5 text-[13px] font-medium text-muted-foreground transition group-hover:bg-[#0f172a] group-hover:text-white">
            Consulter la formation
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ParticipantFormationsView({
  firstName,
  trainings,
  upcomingSessions,
}: ParticipantFormationsViewProps) {
  const nextSession = upcomingSessions[0];
  const groups = groupByProjectAndProgram(trainings);

  const formationsLabel = countLabel(trainings.length, "formation", "formations");
  const sessionsLabel =
    upcomingSessions.length === 0
      ? "aucune session à venir"
      : `${countLabel(upcomingSessions.length, "session", "sessions")} à venir`;

  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-4 sm:-mt-6 md:-mt-8 feed-canvas pb-12">
      <header className="feed-glass-banner">
        <div className="relative z-10 mx-auto max-w-[1128px] px-4 py-6 sm:px-6 sm:py-8">
          <span className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/90">
            Mes formations
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Bonjour {firstName},
          </h1>
          <p className="mt-2 text-[14px] text-white/75">
            {formationsLabel} · {sessionsLabel}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1128px] px-4 pt-6 sm:px-6">
        {nextSession && (
          <Link
            href={participantRoutes.training(nextSession.trainingId)}
            className="group mb-8 flex items-center gap-4 overflow-hidden rounded-lg border border-black/[0.04] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div className="hero-banner-base flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <Calendar className="relative z-10 h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#CD3465]">
                Prochaine session
              </p>
              <p className="mt-0.5 font-semibold leading-snug group-hover:text-[#CD3465]">
                {nextSession.trainingTitle}
              </p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {formatDate(nextSession.startDatetime)}
                {nextSession.locationName && (
                  <>
                    {" · "}
                    <MapPin className="mr-0.5 inline h-3 w-3" />
                    {nextSession.locationName}
                  </>
                )}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40 group-hover:text-[#CD3465]" />
          </Link>
        )}

        {trainings.length === 0 ? (
          <div className="py-20 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-4 font-semibold">Aucune formation assignée</p>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Vous serez notifié lorsqu&apos;une formation vous sera ouverte.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((project) => (
              <section key={project.projectId}>
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#CD3465]" />
                  <h2 className="text-[17px] font-semibold text-[#0a0a0a]">{project.projectName}</h2>
                </div>

                <div className="space-y-8">
                  {project.programs.map((program) => (
                    <div key={`${project.projectId}-${program.programName}`}>
                      <p className="mb-3 inline-flex items-center rounded-md bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {program.programName}
                      </p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {program.trainings.map((training) => (
                          <FormationCard key={training.id} training={training} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
