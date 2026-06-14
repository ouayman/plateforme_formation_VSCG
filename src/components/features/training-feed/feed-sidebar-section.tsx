"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedSidebarSectionProps = {
  icon: LucideIcon;
  title: string;
  count?: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
  headerAction?: ReactNode;
  empty?: { icon: LucideIcon; message: ReactNode };
  children?: ReactNode;
  id?: string;
};

function hasRenderableContent(node: ReactNode): boolean {
  if (node == null || node === false) return false;
  if (Array.isArray(node)) return node.some(hasRenderableContent);
  return true;
}

function SectionCountTag({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

export function FeedSidebarSection({
  icon: Icon,
  title,
  count,
  collapsible = false,
  defaultOpen = true,
  headerAction,
  empty,
  children,
  id,
}: FeedSidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isEmpty = !hasRenderableContent(children);
  const isOpen = !collapsible || open;

  const titleBlock = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-[#CD3465]" strokeWidth={1.75} />
      <p className="min-w-0 flex-1 text-left text-[13px] font-semibold text-[#0a0a0a]">
        {title}
      </p>
      {count !== undefined && <SectionCountTag count={count} />}
    </>
  );

  return (
    <section id={id} className="feed-surface scroll-mt-24 overflow-visible">
      {collapsible ? (
        <div className="flex items-center gap-2 border-b border-surface px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left transition hover:bg-black/[0.02]"
            aria-expanded={isOpen}
          >
            {titleBlock}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
          {headerAction && (
            <span
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {headerAction}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-surface px-4 py-3 sm:px-5">
          {titleBlock}
          {headerAction}
        </div>
      )}

      {isOpen &&
        (isEmpty && empty ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <empty.icon className="h-10 w-10 text-muted-foreground/25" strokeWidth={1.25} />
            <p className="mt-3 max-w-[220px] whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
              {empty.message}
            </p>
          </div>
        ) : (
          children
        ))}
    </section>
  );
}
