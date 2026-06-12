"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Building2, Calendar, ChevronRight, FolderKanban, Route } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProjectItem = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  deletedAt: string | null;
  company: { name: string };
  _count: { programs: number };
};

type ProjectsListProps = {
  activeProjects: ProjectItem[];
  deletedProjects: ProjectItem[];
  canManageDeleted: boolean;
};

const CARD_ACCENTS = [
  {
    border: "border-violet-200/80",
    bg: "bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-white",
    icon: "bg-violet-500/15 text-violet-700",
    stripe: "bg-violet-500",
  },
  {
    border: "border-blue-200/80",
    bg: "bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white",
    icon: "bg-blue-500/15 text-blue-700",
    stripe: "bg-blue-500",
  },
  {
    border: "border-emerald-200/80",
    bg: "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white",
    icon: "bg-emerald-500/15 text-emerald-700",
    stripe: "bg-emerald-500",
  },
  {
    border: "border-amber-200/80",
    bg: "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white",
    icon: "bg-amber-500/15 text-amber-700",
    stripe: "bg-amber-500",
  },
  {
    border: "border-rose-200/80",
    bg: "bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white",
    icon: "bg-rose-500/15 text-rose-700",
    stripe: "bg-rose-500",
  },
];

function accentForProject(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % CARD_ACCENTS.length;
  return CARD_ACCENTS[hash];
}

export function ProjectsList({
  activeProjects,
  deletedProjects,
  canManageDeleted,
}: ProjectsListProps) {
  const [showDeleted, setShowDeleted] = useState(false);
  const hasDeleted = canManageDeleted && deletedProjects.length > 0;

  return (
    <div className="space-y-6">
      {activeProjects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {hasDeleted && (
        <div className="space-y-3 border-t border-border/50 pt-4">
          <button
            type="button"
            onClick={() => setShowDeleted((v) => !v)}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Archive className="h-4 w-4" />
            {showDeleted ? "Masquer les projets supprimés" : "Afficher les projets supprimés"}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
              {deletedProjects.length}
            </span>
          </button>

          {showDeleted && (
            <div className="grid gap-3 sm:grid-cols-2 opacity-75">
              {deletedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} deleted />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, deleted = false }: { project: ProjectItem; deleted?: boolean }) {
  const accent = accentForProject(project.id);

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        accent.border,
        accent.bg,
        deleted && "opacity-80"
      )}
    >
      <span className={cn("absolute left-0 top-0 h-full w-1", accent.stripe)} aria-hidden />
      <div className="flex items-start gap-3 pl-2">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accent.icon)}>
          <FolderKanban className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug text-foreground">{project.name}</p>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:text-muted-foreground" />
          </div>
          {deleted && (
            <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Supprimé
            </span>
          )}
          <p className="mt-2 flex flex-col gap-1.5 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {project.company.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Route className="h-3.5 w-3.5 shrink-0" />
              {project._count.programs} programme{project._count.programs !== 1 ? "s" : ""}
              {deleted && project.deletedAt && (
                <> · supprimé le {formatDate(project.deletedAt)}</>
              )}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
