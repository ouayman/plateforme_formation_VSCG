"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Building2,
  Calendar,
  ChevronRight,
  Route,
} from "lucide-react";
import { OrgLogo } from "@/components/layout/org-logo";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProjectItem = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  deletedAt: string | null;
  company: { name: string; logoUrl: string | null };
  _count: { programs: number };
};

type ProjectsListProps = {
  activeProjects: ProjectItem[];
  deletedProjects: ProjectItem[];
  canManageDeleted: boolean;
};

type ProjectStatus = "upcoming" | "active" | "completed";

const HERO_GRADIENTS = [
  "from-[#CD3465]/90 via-[#a82855]/80 to-[#7c1d42]",
  "from-[#3b82f6]/90 via-[#2563eb]/80 to-[#1d4ed8]",
  "from-[#8b5cf6]/90 via-[#7c3aed]/80 to-[#6d28d9]",
  "from-[#10b981]/90 via-[#059669]/80 to-[#047857]",
  "from-[#f59e0b]/90 via-[#d97706]/80 to-[#b45309]",
  "from-[#6366f1]/90 via-[#4f46e5]/80 to-[#4338ca]",
];

const STATUS_STYLES: Record<
  ProjectStatus,
  { label: string; badge: string }
> = {
  upcoming: {
    label: "À venir",
    badge: "border-blue-200/80 bg-blue-50 text-blue-700",
  },
  active: {
    label: "En cours",
    badge: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  },
  completed: {
    label: "Terminé",
    badge: "border-border/60 bg-muted/40 text-muted-foreground",
  },
};

function accentIndex(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % HERO_GRADIENTS.length;
  return hash;
}

function projectStatus(startDate: string, endDate: string): ProjectStatus {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "active";
}

function projectInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProjectsList({
  activeProjects,
  deletedProjects,
  canManageDeleted,
}: ProjectsListProps) {
  const [showDeleted, setShowDeleted] = useState(false);
  const hasDeleted = canManageDeleted && deletedProjects.length > 0;

  return (
    <div className="space-y-8">
      {activeProjects.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {hasDeleted && (
        <div className="space-y-4 border-t border-border/50 pt-6">
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 opacity-80">
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
  const status = projectStatus(project.startDate, project.endDate);
  const statusStyle = STATUS_STYLES[status];
  const gradient = HERO_GRADIENTS[accentIndex(project.id)];

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]",
        deleted && "opacity-90"
      )}
    >
      <div
        className={cn(
          "relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br px-6",
          gradient
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        {project.company.logoUrl ? (
          <div className="relative flex h-16 w-full max-w-[200px] items-center justify-center rounded-xl bg-white/95 px-4 py-3 shadow-sm">
            <OrgLogo
              logoUrl={project.company.logoUrl}
              alt={project.company.name}
              className="mx-auto max-h-10 w-auto max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold tracking-tight text-white backdrop-blur-sm">
            {projectInitials(project.name) || (
              <Building2 className="h-7 w-7 text-white/90" />
            )}
          </div>
        )}
        {deleted && (
          <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Supprimé
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-foreground transition-colors group-hover:text-primary">
              {project.name}
            </h3>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">{project.company.name}</p>
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {!deleted && (
            <Badge
              variant="outline"
              className={cn("gap-1 text-[11px] font-normal", statusStyle.badge)}
            >
              {statusStyle.label}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="gap-1 border-border/60 bg-muted/20 text-[11px] font-normal text-muted-foreground"
          >
            <Route className="h-3 w-3" />
            {project._count.programs} programme{project._count.programs !== 1 ? "s" : ""}
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 border-border/60 bg-muted/20 text-[11px] font-normal text-muted-foreground"
          >
            <Calendar className="h-3 w-3" />
            {formatDate(project.startDate)} — {formatDate(project.endDate)}
          </Badge>
          {deleted && project.deletedAt && (
            <Badge
              variant="outline"
              className="gap-1 border-border/60 bg-muted/20 text-[11px] font-normal text-muted-foreground"
            >
              Supprimé le {formatDate(project.deletedAt)}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
