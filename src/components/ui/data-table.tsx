import { cn } from "@/lib/utils";

type DataTableProps = {
  children: React.ReactNode;
  countLabel: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
};

export function DataTable({
  children,
  countLabel,
  subtitle,
  action,
  className,
}: DataTableProps) {
  return (
    <div className={cn("surface-panel", className)}>
      {subtitle && (
        <div className="flex flex-col gap-3 border-b border-border/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-sm font-semibold text-foreground">{subtitle}</h2>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="table-scroll px-2 pb-2 pt-1">{children}</div>
      <div className="border-t border-border/40 px-4 py-3 sm:px-6">
        <p className="text-[13px] text-muted-foreground">{countLabel}</p>
      </div>
    </div>
  );
}
