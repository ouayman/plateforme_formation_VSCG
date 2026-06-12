"use client";

import {
  isRichHtml,
  linkifyPlainText,
  sanitizePostHtml,
} from "@/lib/feed-text-utils";
import { cn } from "@/lib/utils";

type FeedPostContentProps = {
  text: string;
  className?: string;
};

export function FeedPostContent({ text, className }: FeedPostContentProps) {
  const html = isRichHtml(text)
    ? sanitizePostHtml(text)
    : linkifyPlainText(text.replace(/\n/g, "<br />"));

  return (
    <div
      className={cn(
        "mt-2.5 text-[15px] leading-[1.55] text-[#1a1a1a] [&_a]:text-[#CD3465] [&_a]:hover:underline",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
