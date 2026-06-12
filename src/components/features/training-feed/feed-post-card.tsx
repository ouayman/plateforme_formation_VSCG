"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Download,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/format";
import { displayFileName } from "@/lib/upload-utils";
import { isInternalPostLink } from "@/lib/training-feed-utils";
import { BRANDING } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  FeedPostReactions,
} from "@/components/features/training-feed/feed-post-reactions";
import { FeedPostContent } from "@/components/features/training-feed/feed-post-content";
import { FeedRichEditor } from "@/components/features/training-feed/feed-rich-editor";
import type { ReactionCounts } from "@/lib/training-feed-utils";

export type FeedPost = {
  id: string;
  type: "manual" | "system";
  systemType: string | null;
  text: string | null;
  linkUrl: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImageUrl: string | null;
  createdAt: string;
  reactionCounts: ReactionCounts;
  reactionTotal: number;
  userReaction: keyof ReactionCounts | null;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    companyName: string;
  } | null;
  attachments: {
    id: string;
    fileUrl: string;
    fileName: string | null;
    createdAt: string;
  }[];
};

type FeedPostCardProps = {
  trainingId: string;
  post: FeedPost;
  canModerate: boolean;
  currentUserId: string;
  isAdmin: boolean;
  hasFeedback?: boolean;
  className?: string;
  animationIndex?: number;
};

const SYSTEM_LABELS: Record<string, string> = {
  welcome: "Bienvenue",
  absence: "Présence",
  training_completed: "Formation terminée",
  certificate_available: "Attestation",
};

export function FeedPostCard({
  trainingId,
  post,
  currentUserId,
  isAdmin,
  hasFeedback = false,
  className,
  animationIndex = 0,
}: FeedPostCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text ?? "");

  const isOwner = post.author?.id === currentUserId;
  const showMenu = post.type === "manual" && (isOwner || isAdmin);
  const isSystem = post.type === "system";
  const isDownloadLink = post.linkUrl?.includes("/certificates/") && post.linkUrl?.includes("/download");

  async function handleDelete() {
    if (!confirm("Supprimer cette publication ?")) return;
    await fetch(`/api/trainings/${trainingId}/posts/${post.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleSaveEdit() {
    await fetch(`/api/trainings/${trainingId}/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText.trim() || null }),
    });
    setEditing(false);
    router.refresh();
  }

  const author = post.author;
  const displayName = author
    ? `${author.firstName} ${author.lastName}`
    : "Value Stream Consulting";

  return (
    <article
      className={cn("feed-post-enter px-4 py-4 sm:px-5 sm:py-5", className)}
      style={{ animationDelay: `${Math.min(animationIndex * 60, 360)}ms` }}
    >
      <div className="flex gap-3">
        {isSystem ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white">
            <Image
              src={BRANDING.DEFAULT_FAVICON}
              alt="VSCG"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
        ) : author ? (
          <UserAvatar
            userId={author.id}
            firstName={author.firstName}
            lastName={author.lastName}
            avatarUrl={author.avatarUrl}
            size={40}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <p className="text-[14px] font-semibold leading-tight text-[#0a0a0a]">
                  {displayName}
                </p>
                {isSystem && post.systemType && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#CD3465]/10 px-2 py-0.5 text-[10px] font-medium text-[#CD3465]">
                    <Sparkles className="h-3 w-3" />
                    {SYSTEM_LABELS[post.systemType] ?? "Système"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                {author?.companyName && !isSystem && (
                  <>
                    <span>{author.companyName}</span>
                    <span className="mx-1">·</span>
                  </>
                )}
                <span>{formatRelativeTime(post.createdAt)}</span>
              </p>
            </div>

            {showMenu && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-black/[0.04]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10"
                      aria-label="Fermer"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-black/[0.04]"
                        onClick={() => {
                          setEditText(post.text ?? "");
                          setEditing(true);
                          setMenuOpen(false);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-destructive hover:bg-destructive/5"
                        onClick={() => {
                          setMenuOpen(false);
                          handleDelete();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div className="mt-3 space-y-2">
              <div className="rounded-lg bg-black/[0.03] px-3.5 py-2.5 ring-1 ring-black/[0.04]">
                <FeedRichEditor
                  value={editText}
                  onChange={setEditText}
                  onLinkPreviewChange={() => {}}
                  enableLinkPreview={false}
                  placeholder="Modifier la publication..."
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full px-4" onClick={handleSaveEdit}>
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setEditing(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <>
              {post.text && <FeedPostContent text={post.text} />}

              {post.attachments.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-lg bg-black/[0.03]">
                  {post.attachments.map((file, i) => (
                    <a
                      key={file.id}
                      href={`/api/trainings/${trainingId}/posts/${post.id}/attachments/${file.id}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-[13px] transition hover:bg-black/[0.03]",
                        i > 0 && "border-t border-surface"
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#CD3465] shadow-sm">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {file.fileName ?? displayFileName(file.fileUrl)}
                      </span>
                      <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}

              {post.linkUrl && !isInternalPostLink(post.linkUrl) && (
                <a
                  href={post.linkUrl}
                  target={isDownloadLink ? undefined : "_blank"}
                  rel={isDownloadLink ? undefined : "noopener noreferrer"}
                  className="group mt-3 block overflow-hidden rounded-lg bg-black/[0.03] transition hover:bg-black/[0.05]"
                >
                  {post.linkImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.linkImageUrl}
                      alt=""
                      className="max-h-52 w-full object-cover"
                    />
                  )}
                  <div className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#0a0a0a] group-hover:text-[#CD3465]">
                        {post.linkTitle ?? post.linkUrl}
                      </p>
                      {post.linkDescription && (
                        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                          {post.linkDescription}
                        </p>
                      )}
                    </div>
                    {isDownloadLink ? (
                      <Download className="mt-0.5 h-4 w-4 shrink-0 text-[#CD3465]" />
                    ) : (
                      <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </a>
              )}

              {post.systemType === "training_completed" &&
                post.linkUrl === "vscg://feedback" &&
                !hasFeedback && (
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("feed-feedback")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="mt-3 inline-flex items-center rounded-full bg-[#CD3465] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#b82d58]"
                >
                  Donner mon avis
                </button>
              )}

              <FeedPostReactions
                trainingId={trainingId}
                postId={post.id}
                initialCounts={post.reactionCounts}
                initialUserReaction={post.userReaction}
              />
            </>
          )}
        </div>
      </div>
    </article>
  );
}
