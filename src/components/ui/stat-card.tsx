import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconVariant = "primary" | "blue" | "emerald" | "violet" | "amber";

const variants: Record<IconVariant, string> = {
  primary: "from-[#CD3465]/10 to-[#CD3465]/5 text-[#CD3465]",
  blue: "from-blue-500/10 to-blue-500/5 text-blue-600",
  emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
  violet: "from-violet-500/10 to-violet-500/5 text-violet-600",
  amber: "from-amber-500/10 to-amber-500/5 text-amber-600",
};

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: IconVariant;
};

export function StatCard({ label, value, icon: Icon, variant = "primary" }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
            variants[variant]
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-[13px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
