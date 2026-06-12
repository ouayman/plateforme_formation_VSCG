import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProgramCardTags } from "@/components/features/programs/training-card-tags";

type Program = {
  id: string;
  name: string;
  orderIndex: number;
  _count: { trainings: number; participants: number };
};

type ProgramCardsProps = {
  projectId: string;
  programs: Program[];
  canEdit: boolean;
};

const ACCENTS = [
  "from-[#CD3465] to-[#a82855]",
  "from-[#3b82f6] to-[#1d4ed8]",
  "from-[#8b5cf6] to-[#6d28d9]",
  "from-[#10b981] to-[#047857]",
  "from-[#f59e0b] to-[#d97706]",
];

export function ProgramCards({ projectId, programs }: ProgramCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {programs.map((program, i) => (
        <Link
          key={program.id}
          href={`/projects/${projectId}/programs/${program.id}`}
          className="group relative block overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        >
          <div
            className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${ACCENTS[i % ACCENTS.length]}`}
          />
          <div className="p-6 pl-7">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                {program.name}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
            </div>
            <ProgramCardTags
              trainingCount={program._count.trainings}
              participantCount={program._count.participants}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
