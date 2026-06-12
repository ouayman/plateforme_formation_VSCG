"use client";

import { Download, FileText, FolderOpen } from "lucide-react";
import { formatDate } from "@/lib/format";
import { displayFileName } from "@/lib/upload-utils";
import type { FeedPost } from "@/components/features/training-feed/feed-post-card";
import { FeedFeedbackPanel } from "@/components/features/training-feed/feed-feedback-panel";
import {
  FeedCertificatePanel,
} from "@/components/features/training-feed/feed-certificate-panel";
import { FeedTrainingParticipantsSection } from "@/components/features/training-feed/feed-training-participants-section";
import {
  FeedFeedbackListPanel,
  type TrainingFeedbackRow,
} from "@/components/features/training-feed/feed-feedback-list-panel";
import { FeedSessionsPanel, type FeedSessionRow } from "@/components/features/training-feed/feed-sessions-panel";
import { FeedSidebarSection } from "@/components/features/training-feed/feed-sidebar-section";

type CertificateRow = {
  userId: string;
  status: "locked" | "unlocked";
  attendancePercent: number | null;
  user: { firstName: string; lastName: string; email: string };
};

type ParticipantUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type FeedSidebarProps = {
  trainingId: string;
  trainingTitle: string;
  posts: FeedPost[];
  showFeedbackPanel: boolean;
  canSubmitFeedback: boolean;
  showFeedbackList: boolean;
  allFeedbacks: TrainingFeedbackRow[];
  myFeedback: { rating: number; comment: string | null } | null;
  certificateStatus: "locked" | "unlocked" | null;
  canManageCertificates: boolean;
  canManageParticipants: boolean;
  certificates: CertificateRow[];
  availableParticipants: ParticipantUser[];
  sessions: FeedSessionRow[];
  showSessionAttendance: boolean;
  canManageSessions?: boolean;
  sessionTrainers?: { id: string; firstName: string; lastName: string }[];
  sessionLocations?: { id: string; name: string }[];
  sessionProjectMeta?: { companyName: string; projectName: string; programName: string };
};

export function FeedSidebar({
  trainingId,
  trainingTitle,
  posts,
  showFeedbackPanel,
  canSubmitFeedback,
  showFeedbackList,
  allFeedbacks,
  myFeedback,
  certificateStatus,
  canManageCertificates,
  canManageParticipants,
  certificates,
  availableParticipants,
  sessions,
  showSessionAttendance,
  canManageSessions = false,
  sessionTrainers = [],
  sessionLocations = [],
  sessionProjectMeta = { companyName: "", projectName: "", programName: "" },
}: FeedSidebarProps) {
  const staffSidebar = showFeedbackList;

  const documents = posts
    .flatMap((post) =>
      post.attachments.map((file) => ({
        ...file,
        postId: post.id,
        postDate: post.createdAt,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <aside className="hidden space-y-3 lg:block">
      <FeedSidebarSection
        icon={FolderOpen}
        title="Documents"
        count={documents.length}
        collapsible={staffSidebar}
        empty={{
          icon: FileText,
          message: "Les documents apparaîtront ici lorsque votre formateur les aura partagés.",
        }}
      >
        {documents.length > 0 && (
          <ul>
            {documents.map((doc, i) => (
              <li key={doc.id} className={i > 0 ? "border-t border-surface" : undefined}>
                <a
                  href={`/api/trainings/${trainingId}/posts/${doc.postId}/attachments/${doc.id}`}
                  className="group flex items-center gap-3 px-4 py-3 transition hover:bg-black/[0.03] sm:px-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-[#CD3465] group-hover:bg-white">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium group-hover:text-[#CD3465]">
                      {doc.fileName ?? displayFileName(doc.fileUrl)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(doc.postDate)}</p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </FeedSidebarSection>

      <FeedSessionsPanel
        trainingId={trainingId}
        sessions={sessions}
        showAttendance={showSessionAttendance}
        staffView={canManageSessions}
        collapsible={staffSidebar}
        canManageSessions={canManageSessions}
        trainers={sessionTrainers}
        locations={sessionLocations}
        trainingTitle={trainingTitle}
        projectMeta={sessionProjectMeta}
      />

      {showFeedbackPanel && certificateStatus !== null && (
        <FeedCertificatePanel trainingId={trainingId} status={certificateStatus} />
      )}

      {showFeedbackPanel && <FeedFeedbackPanel trainingId={trainingId} myFeedback={myFeedback} canSubmit={canSubmitFeedback} />}

      {canManageCertificates && (
        <FeedTrainingParticipantsSection
          trainingId={trainingId}
          certificates={certificates}
          availableParticipants={availableParticipants}
          canManage={canManageParticipants}
          collapsible={staffSidebar}
        />
      )}

      {showFeedbackList && (
        <FeedFeedbackListPanel feedbacks={allFeedbacks} collapsible={staffSidebar} />
      )}
    </aside>
  );
}
