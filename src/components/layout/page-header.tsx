import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconVariant = "primary" | "dark" | "blue" | "emerald" | "violet" | "amber";

const iconVariants: Record<IconVariant, string> = {
  primary: "icon-badge-primary",
  dark: "icon-badge-dark",
  blue: "icon-badge-blue",
  emerald: "icon-badge-emerald",
  violet: "icon-badge-violet",
  amber: "icon-badge-amber",
};

type PageHeaderProps = {
  icon: LucideIcon;
  iconVariant?: IconVariant;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({
  icon: Icon,
  iconVariant = "primary",
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn(iconVariants[iconVariant], "h-10 w-10 sm:h-11 sm:w-11")}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && (
            <p className="mt-1 text-[14px] text-muted-foreground sm:text-[15px]">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </div>
  );
}
