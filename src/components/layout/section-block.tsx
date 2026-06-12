import { cn } from "@/lib/utils";

type SectionBlockProps = {
  title?: string;
  hideTitle?: boolean;
  action?: React.ReactNode;
  countLabel: string;
  children: React.ReactNode;
  variant?: "panel" | "plain";
  className?: string;
  id?: string;
};

export function SectionBlock({
  title,
  hideTitle = false,
  action,
  countLabel,
  children,
  variant = "panel",
  className,
  id,
}: SectionBlockProps) {
  const showHeader = Boolean((!hideTitle && title) || action);

  const header = showHeader ? (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:gap-4">
      {!hideTitle && title ? (
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      ) : action ? null : (
        <div />
      )}
      {action && <div className={cn(!hideTitle && title ? "" : "ml-auto")}>{action}</div>}
    </div>
  ) : null;

  const footer = (
    <div className="border-t border-border/40 px-4 py-3 sm:px-6">
      <p className="text-[13px] text-muted-foreground">{countLabel}</p>
    </div>
  );

  if (variant === "plain") {
    return (
      <div id={id} className={cn("space-y-0 scroll-mt-24", className)}>
        {header}
        <div className="px-2 pb-2 pt-1">{children}</div>
        <div className="mt-8 px-4 pb-1 sm:px-6">
          <p className="text-[13px] text-muted-foreground">{countLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div id={id} className={cn("surface-panel scroll-mt-24 overflow-visible", className)}>
      {header && <div className="border-b border-border/40">{header}</div>}
      <div className="table-scroll px-2 pb-2 pt-1">{children}</div>
      {footer}
    </div>
  );
}
