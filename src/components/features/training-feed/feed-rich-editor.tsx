"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Palette, Underline } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractFirstUrl, plainTextFromHtml, sanitizePostHtml } from "@/lib/feed-text-utils";
import type { LinkPreviewData } from "@/lib/link-preview";

const TEXT_COLORS = [
  { label: "Noir", value: "#0a0a0a" },
  { label: "Rose", value: "#CD3465" },
  { label: "Gris", value: "#64748b" },
];

type FeedRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onLinkPreviewChange: (preview: LinkPreviewData | null, url: string | null) => void;
  placeholder?: string;
  className?: string;
  enableLinkPreview?: boolean;
};

export function FeedRichEditor({
  value,
  onChange,
  onLinkPreviewChange,
  placeholder = "Partagez une mise à jour ou un lien...",
  className,
  enableLinkPreview = true,
}: FeedRichEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showColors, setShowColors] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function exec(cmd: string, val?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(sanitizePostHtml(ref.current.innerHTML));
  }

  function handleInput() {
    if (!ref.current) return;
    const html = sanitizePostHtml(ref.current.innerHTML);
    onChange(html);

    clearTimeout(previewTimer.current);
    if (!enableLinkPreview) return;
    previewTimer.current = setTimeout(async () => {
      const url = extractFirstUrl(plainTextFromHtml(html));
      if (!url) {
        onLinkPreviewChange(null, null);
        return;
      }
      const res = await fetch("/api/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        onLinkPreviewChange(await res.json(), url);
      } else {
        onLinkPreviewChange(null, url);
      }
    }, 600);
  }

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          title="Gras"
          onClick={() => exec("bold")}
          className="rounded-md p-2 text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Italique"
          onClick={() => exec("italic")}
          className="rounded-md p-2 text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Souligné"
          onClick={() => exec("underline")}
          className="rounded-md p-2 text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground"
        >
          <Underline className="h-4 w-4" />
        </button>
        <div className="relative">
          <button
            type="button"
            title="Couleur"
            onClick={() => setShowColors((v) => !v)}
            className={cn(
              "rounded-md p-2 text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground",
              showColors && "bg-black/[0.04] text-[#CD3465]"
            )}
          >
            <Palette className="h-4 w-4" />
          </button>
          {showColors && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Fermer"
                onClick={() => setShowColors(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      exec("foreColor", c.value);
                      setShowColors(false);
                    }}
                    className="h-6 w-6 rounded-full ring-1 ring-black/10 transition hover:scale-110"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={handleInput}
        className="min-h-[72px] w-full text-[15px] leading-relaxed outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:text-[#CD3465] [&_a]:underline"
        suppressContentEditableWarning
      />
    </div>
  );
}
