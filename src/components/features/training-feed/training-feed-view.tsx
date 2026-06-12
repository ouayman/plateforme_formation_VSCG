"use client";

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { FeedComposer } from "@/components/features/training-feed/feed-composer";
import { FeedPostCard, type FeedPost } from "@/components/features/training-feed/feed-post-card";
import { FeedSidebar } from "@/components/features/training-feed/feed-sidebar";
import { FeedMobileDocuments } from "@/components/features/training-feed/feed-mobile-documents";
import { FeedFeedbackPanel } from "@/components/features/training-feed/feed-feedback-panel";
import { FeedFeedbackListPanel, type TrainingFeedbackRow } from "@/components/features/training-feed/feed-feedback-list-panel";
import { FeedCertificatePanel } from "@/components/features/training-feed/feed-certificate-panel";
import { FeedTrainingParticipantsSection } from "@/components/features/training-feed/feed-training-participants-section";
import { FeedSessionsPanel, type FeedSessionRow } from "@/components/features/training-feed/feed-sessions-panel";
import { FeedBannerProgress } from "@/components/features/training-feed/feed-banner-progress";
import { cn } from "@/lib/utils";

type TrainingFeedViewProps = {
  trainingId: string;
  programId: string;
  title: string;
  programName: string;
  posts: FeedPost[];
  canPublish: boolean;
  canModerate: boolean;
  isAdmin: boolean;
  showFeedbackList: boolean;
  allFeedbacks: TrainingFeedbackRow[];
  hasFeedback: boolean;
  myFeedback: { rating: number; comment: string | null } | null;
  certificateStatus: "locked" | "unlocked" | null;
  canManageCertificates: boolean;
  canManageParticipants: boolean;
  certificates: {
    userId: string;
    status: "locked" | "unlocked";
    attendancePercent: number | null;
    user: { firstName: string; lastName: string; email: string };
  }[];
  availableParticipants: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  sessions: FeedSessionRow[];
  showSessionAttendance: boolean;
  showFeedbackPanel: boolean;
  canSubmitFeedback: boolean;
  canManageSessions?: boolean;
  sessionTrainers?: { id: string; firstName: string; lastName: string }[];
  sessionLocations?: { id: string; name: string }[];
  sessionProjectMeta?: { companyName: string; projectName: string; programName: string };
  progressMode: "participant" | "sessions";
  progress: {
    sessionProgress: number;
    attendanceProgress: number;
    completedSessions: number;
    totalSessions: number;
    attendedSessions: number;
  };
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
};

function matchesSearch(post: FeedPost, query: string) {
  const q = query.toLowerCase();
  const parts = [
    post.text,
    post.linkUrl,
    post.linkTitle,
    post.linkDescription,
    post.author?.firstName,
    post.author?.lastName,
    post.author?.companyName,
    ...post.attachments.map((a) => a.fileName ?? a.fileUrl),
  ];
  return parts.some((p) => p && p.toLowerCase().includes(q));
}

export function TrainingFeedView({
  trainingId,
  title,
  programName,
  posts,
  canPublish,
  canModerate,
  isAdmin,
  showFeedbackList,
  allFeedbacks,
  hasFeedback,
  myFeedback,
  certificateStatus,
  canManageCertificates,
  canManageParticipants,
  certificates,
  availableParticipants,
  sessions,
  showSessionAttendance,
  showFeedbackPanel,
  canSubmitFeedback,
  canManageSessions = false,
  sessionTrainers = [],
  sessionLocations = [],
  sessionProjectMeta = { companyName: "", projectName: "", programName: "" },
  progressMode,
  progress,
  user,
}: TrainingFeedViewProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return posts;
    return posts.filter((p) => matchesSearch(p, search.trim()));
  }, [posts, search]);

  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-4 sm:-mt-6 md:-mt-8 feed-canvas pb-12">
      <header className="feed-glass-banner mb-6">
        <div className="relative z-10 mx-auto max-w-[1128px] px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
                {programName}
              </span>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {title}
              </h1>
              <FeedBannerProgress mode={progressMode} progress={progress} />
            </div>

            <label className="relative block w-full shrink-0 sm:w-56 lg:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/70"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-white/15 bg-white/10 py-0 pl-10 pr-3 text-[13px] text-white outline-none placeholder:text-white/45 backdrop-blur-sm focus:border-white/30 focus:bg-white/15 [&::-webkit-search-cancel-button]:hidden"
              />
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1128px] px-4 sm:px-6">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,640px)_minmax(240px,1fr)] lg:gap-6">
          <div className="feed-surface min-w-0 overflow-hidden">
            {canPublish && (
              <FeedComposer trainingId={trainingId} user={user} embedded />
            )}

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                {search ? (
                  <>
                    <SearchX className="h-10 w-10 text-muted-foreground/25" strokeWidth={1.25} />
                    <p className="mt-3 text-[14px] text-muted-foreground">
                      Aucun résultat pour cette recherche.
                    </p>
                  </>
                ) : (
                  <p className="text-[14px] text-muted-foreground">
                    Le fil est vide pour le moment.
                  </p>
                )}
              </div>
            ) : (
              <div>
                {filtered.map((post, index) => (
                  <FeedPostCard
                    key={post.id}
                    trainingId={trainingId}
                    post={post}
                    canModerate={canModerate}
                    currentUserId={user.id}
                    isAdmin={isAdmin}
                    hasFeedback={hasFeedback}
                    className={cn(index > 0 && "border-t border-surface")}
                    animationIndex={index}
                  />
                ))}
              </div>
            )}
          </div>

          <FeedSidebar
            trainingId={trainingId}
            trainingTitle={title}
            posts={posts}
            showFeedbackPanel={showFeedbackPanel}
            canSubmitFeedback={canSubmitFeedback}
            showFeedbackList={showFeedbackList}
            allFeedbacks={allFeedbacks}
            myFeedback={myFeedback}
            certificateStatus={certificateStatus}
            canManageCertificates={canManageCertificates}
            canManageParticipants={canManageParticipants}
            certificates={certificates}
            availableParticipants={availableParticipants}
            sessions={sessions}
            showSessionAttendance={showSessionAttendance}
            canManageSessions={canManageSessions}
            sessionTrainers={sessionTrainers}
            sessionLocations={sessionLocations}
            sessionProjectMeta={sessionProjectMeta}
          />
        </div>

      <div className="space-y-3 lg:hidden">
          <FeedMobileDocuments trainingId={trainingId} posts={posts} showEmpty />
          <FeedSessionsPanel
            trainingId={trainingId}
            sessions={sessions}
            showAttendance={showSessionAttendance}
            staffView={canManageSessions}
            collapsible={false}
            canManageSessions={canManageSessions}
            trainers={sessionTrainers}
            locations={sessionLocations}
            trainingTitle={title}
            projectMeta={sessionProjectMeta}
          />
          {showFeedbackPanel && certificateStatus !== null && (
            <FeedCertificatePanel trainingId={trainingId} status={certificateStatus} />
          )}
          {showFeedbackPanel && (
            <FeedFeedbackPanel
              trainingId={trainingId}
              myFeedback={myFeedback}
              canSubmit={canSubmitFeedback}
              embedded
            />
          )}
          {canManageCertificates && (
            <FeedTrainingParticipantsSection
              trainingId={trainingId}
              certificates={certificates}
              availableParticipants={availableParticipants}
              canManage={canManageParticipants}
              collapsible={showFeedbackList}
            />
          )}
          {showFeedbackList && (
            <FeedFeedbackListPanel feedbacks={allFeedbacks} collapsible={showFeedbackList} />
          )}
        </div>
      </div>
    </div>
  );
}
