"use client";

import { useState } from "react";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import { FeedRichEditor } from "@/components/features/training-feed/feed-rich-editor";
import { useTrainingFeed } from "@/components/features/training-feed/training-feed-context";
import type { FeedPost } from "@/components/features/training-feed/feed-post-card";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { plainTextFromHtml } from "@/lib/feed-text-utils";
import type { LinkPreviewData } from "@/lib/link-preview";

type FeedComposerProps = {
  trainingId: string;
  user: { firstName: string; lastName: string; id: string; avatarUrl?: string | null };
  embedded?: boolean;
};

export function FeedComposer({ trainingId, user, embedded = false }: FeedComposerProps) {
  const { prependPost } = useTrainingFeed();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [linkPreview, setLinkPreview] = useState<LinkPreviewData | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const plainText = plainTextFromHtml(text).trim();
  const canSubmit = plainText || files.length > 0;

  function addFiles(list: FileList | File[]) {
    setFiles((prev) => [...prev, ...Array.from(list)]);
    setExpanded(true);
  }

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);

    const form = new FormData();
    if (text.trim()) form.set("text", text.trim());
    if (detectedUrl) {
      form.set("linkUrl", detectedUrl);
      if (linkPreview?.title) form.set("linkTitle", linkPreview.title);
      if (linkPreview?.description) form.set("linkDescription", linkPreview.description);
      if (linkPreview?.imageUrl) form.set("linkImageUrl", linkPreview.imageUrl);
    }
    files.forEach((f) => form.append("files", f));

    const res = await fetch(`/api/trainings/${trainingId}/posts`, {
      method: "POST",
      body: form,
    });

    setLoading(false);
    if (!res.ok) return;

    const created = (await res.json()) as FeedPost;
    prependPost(created);

    setText("");
    setFiles([]);
    setLinkPreview(null);
    setDetectedUrl(null);
    setExpanded(false);
  }

  return (
    <div
      className={cn(
        "px-4 py-3 transition sm:px-5 sm:py-4",
        embedded && "feed-composer-zone",
        !embedded && "feed-surface",
        dragOver && "ring-2 ring-[#CD3465]/20"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex gap-3">
        <UserAvatar
          userId={user.id}
          firstName={user.firstName}
          lastName={user.lastName}
          avatarUrl={user.avatarUrl}
          size={40}
        />

        <div className="min-w-0 flex-1">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex h-10 w-full items-center rounded-full bg-black/[0.04] px-4 text-left text-[14px] text-muted-foreground transition hover:bg-black/[0.06]"
            >
              Commencer une publication...
            </button>
          ) : (
            <div className="feed-composer-expand space-y-3">
              <FeedRichEditor
                value={text}
                onChange={setText}
                onLinkPreviewChange={(preview, url) => {
                  setLinkPreview(preview);
                  setDetectedUrl(url);
                }}
              />

              {linkPreview && detectedUrl && (
                <div className="overflow-hidden rounded-lg bg-black/[0.03]">
                  {linkPreview.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={linkPreview.imageUrl}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                  )}
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">
                        {linkPreview.title ?? detectedUrl}
                      </p>
                      {linkPreview.description && (
                        <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                          {linkPreview.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-full p-1 hover:bg-black/[0.06]"
                      onClick={() => {
                        setLinkPreview(null);
                        setDetectedUrl(null);
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {files.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="inline-flex max-w-full items-center gap-2 rounded-full bg-black/[0.04] py-1.5 pl-3 pr-2 text-[12px]"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-black/[0.06]"
                        onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-surface pt-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground">
                  <Paperclip className="h-4 w-4" />
                  Joindre un fichier
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                  />
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(false);
                      setLinkPreview(null);
                      setDetectedUrl(null);
                    }}
                    className="rounded-full px-3 py-2 text-[13px] text-muted-foreground hover:bg-black/[0.04]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit || loading}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#CD3465] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#b82d58] disabled:opacity-40"
                  >
                    <SendHorizontal className="h-4 w-4" />
                    {loading ? "..." : "Publier"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
