"use client";

import { FileText, FolderOpen } from "lucide-react";
import { displayFileName } from "@/lib/upload-utils";
import type { FeedPost } from "@/components/features/training-feed/feed-post-card";
import { FeedSidebarSection } from "@/components/features/training-feed/feed-sidebar-section";

type FeedMobileDocumentsProps = {
  trainingId: string;
  posts: FeedPost[];
  showEmpty?: boolean;
};

export function FeedMobileDocuments({
  trainingId,
  posts,
  showEmpty = false,
}: FeedMobileDocumentsProps) {
  const documents = posts
    .flatMap((post) =>
      post.attachments.map((file) => ({
        ...file,
        postId: post.id,
      }))
    )
    .slice(0, 12);

  const documentCount = posts.flatMap((post) => post.attachments).length;

  if (documents.length === 0 && !showEmpty) return null;

  return (
    <FeedSidebarSection
      icon={FolderOpen}
      title="Documents"
      count={documentCount}
      empty={{
        icon: FileText,
        message: "Les documents apparaîtront ici lorsque votre formateur les aura partagés.",
      }}
    >
      {documents.length > 0 && (
        <div className="feed-scroll-x px-4 py-3 lg:hidden">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={`/api/trainings/${trainingId}/posts/${doc.postId}/attachments/${doc.id}`}
              className="mb-2 flex w-full items-center gap-3 rounded-lg bg-black/[0.03] p-3 transition hover:bg-black/[0.05]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#CD3465] shadow-sm">
                <FileText className="h-5 w-5" />
              </span>
              <p className="line-clamp-2 text-[13px] font-medium leading-snug">
                {doc.fileName ?? displayFileName(doc.fileUrl)}
              </p>
            </a>
          ))}
        </div>
      )}
    </FeedSidebarSection>
  );
}
