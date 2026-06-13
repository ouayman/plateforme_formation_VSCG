import { notFound, redirect } from "next/navigation";
import { Calendar, ClipboardList, MapPin, User } from "lucide-react";
import { requireAuth } from "@/lib/auth/require";
import { loadSessionDetail } from "@/lib/loaders/session-detail";
import { canAccessProjectWithSnapshot, canManageAttendance } from "@/lib/permissions";
import {
  DISPLAY_STATUS_META,
  findNextConfirmedSessionId,
  getSessionDisplayStatus,
} from "@/lib/session-display";
import {
  getAttendanceTaskStatus,
  getReportTaskStatus,
  TASK_STATUS_LABELS,
} from "@/lib/session-tasks";
import { countLabel, formatDatetime } from "@/lib/format";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { PageHeader } from "@/components/layout/page-header";
import { SectionBlock } from "@/components/layout/section-block";
import { AttendanceEditor } from "@/components/features/sessions/attendance-editor";
import { ReportEditor } from "@/components/features/sessions/report-editor";
import { SessionTaskButton } from "@/components/features/trainings/session-task-button";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmée",
  pending: "À confirmer",
  cancelled: "Annulée",
};

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  const session = await loadSessionDetail(params.id);

  if (!session) notFound();

  const projectId = session.training.program.projectId;
  const projectSnapshot = session.training.program.project;

  const [allowed, canEdit] = await Promise.all([
    canAccessProjectWithSnapshot(
      user.id,
      projectId,
      { deletedAt: projectSnapshot.deletedAt, companyId: projectSnapshot.companyId },
      user.permissions
    ),
    canManageAttendance(user.id, session.id),
  ]);

  if (!allowed) redirect("/projects");

  const report = session.reports[0] ?? null;
  const participantRows = session.participants.map((p) => ({
    attendanceStatus: p.attendanceStatus,
  }));
  const attendanceStatus = getAttendanceTaskStatus(session.endDatetime, participantRows);
  const reportStatus = getReportTaskStatus(session.endDatetime, !!report);
  const nextSessionId = findNextConfirmedSessionId(session.training.sessions);
  const displayStatus = getSessionDisplayStatus(
    {
      id: session.id,
      status: session.status,
      startDatetime: session.startDatetime,
      endDatetime: session.endDatetime,
    },
    { staffView: true, nextSessionId }
  );
  const displayLabel = displayStatus ? DISPLAY_STATUS_META[displayStatus].label : STATUS_LABELS[session.status];

  return (
    <div className="space-y-8">
      <SetBreadcrumb
        items={[
          { label: "Projets", href: "/projects" },
          { label: session.training.program.project.name, href: `/projects/${projectId}` },
          {
            label: session.training.program.name,
            href: `/projects/${projectId}/programs/${session.training.program.id}`,
          },
          { label: session.training.title, href: `/trainings/${session.training.id}` },
          { label: formatDatetime(session.startDatetime) },
        ]}
      />

      <PageHeader
        icon={Calendar}
        iconVariant="primary"
        title={formatDatetime(session.startDatetime)}
        description={`${session.training.title} · ${displayLabel}`}
      />

      <div className="flex flex-wrap gap-2">
        <SessionTaskButton
          href="#emargement"
          label="Gérer la présence"
          status={attendanceStatus}
          icon="attendance"
        />
        <SessionTaskButton
          href="#compte-rendu"
          label="Compte rendu"
          status={reportStatus}
          icon="report"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Formateur
          </p>
          <p className="mt-2 flex items-center gap-2 font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            {session.trainer
              ? `${session.trainer.firstName} ${session.trainer.lastName}`
              : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Lieu
          </p>
          <p className="mt-2 flex items-center gap-2 font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {session.location?.name || "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Émargement
          </p>
          <p className="mt-2 text-sm font-medium">{TASK_STATUS_LABELS[attendanceStatus]}</p>
        </div>
      </div>

      <SectionBlock
        id="emargement"
        title="Émargement"
        countLabel={countLabel(session.participants.length, "participant", "participants")}
      >
        {session.participants.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Aucun participant"
            description="Inscrivez des participants au programme."
          />
        ) : (
          <div className="px-4 pb-2 pt-3">
            <AttendanceEditor
              sessionId={session.id}
              canEdit={canEdit}
              participants={session.participants.map((p) => ({
                userId: p.user.id,
                firstName: p.user.firstName,
                lastName: p.user.lastName,
                attendanceStatus: p.attendanceStatus,
              }))}
            />
          </div>
        )}
      </SectionBlock>

      <SectionBlock
        id="compte-rendu"
        title="Compte-rendu formateur"
        countLabel={report ? "1 compte-rendu" : "0 compte-rendu"}
      >
        <ReportEditor
          sessionId={session.id}
          canEdit={canEdit}
          report={
            report
              ? {
                  content: report.content,
                  createdAt: report.createdAt.toISOString(),
                  trainer: report.trainer,
                }
              : null
          }
        />
      </SectionBlock>
    </div>
  );
}
