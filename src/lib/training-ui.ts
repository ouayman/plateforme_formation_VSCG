import { countLabel } from "@/lib/format";

export type TrainingScheduleWindow = {
  startDatetime: Date | string;
  endDatetime: Date | string;
};

export type TrainingLifecycleStatus = "upcoming" | "in_progress" | "completed" | "none";

export function getTrainingLifecycleStatus(
  sessions: TrainingScheduleWindow[],
  now = new Date()
): TrainingLifecycleStatus {
  if (sessions.length === 0) return "none";

  const starts = sessions.map((s) => new Date(s.startDatetime).getTime());
  const ends = sessions.map((s) => new Date(s.endDatetime).getTime());
  const firstStart = Math.min(...starts);
  const lastEnd = Math.max(...ends);
  const ts = now.getTime();

  if (ts < firstStart) return "upcoming";
  if (ts > lastEnd) return "completed";
  return "in_progress";
}

export function trainingLifecycleLabel(status: TrainingLifecycleStatus) {
  switch (status) {
    case "upcoming":
      return "À venir";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminée";
    default:
      return "Sans session";
  }
}

export function countFeedDocuments(
  posts: { _count: { attachments: number } }[]
) {
  return posts.reduce((sum, post) => sum + post._count.attachments, 0);
}

export function formatTrainingCount(count: number) {
  return `${count} formation${count !== 1 ? "s" : ""}`;
}

export function mapTrainingCardRow(training: {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  _count: { sessions: number; participants: number };
  sessions: { startDatetime: Date | string; endDatetime: Date | string }[];
  posts?: { _count: { attachments: number } }[];
  documentCount?: number;
}) {
  return {
    id: training.id,
    title: training.title,
    description: training.description,
    orderIndex: training.orderIndex,
    sessionCount: training._count.sessions,
    participantCount: training._count.participants,
    documentCount:
      training.documentCount ?? countFeedDocuments(training.posts ?? []),
    lifecycleStatus: getTrainingLifecycleStatus(training.sessions),
  };
}

export { countLabel };
