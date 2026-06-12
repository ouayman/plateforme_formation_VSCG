"use client";

import { Award, Calendar, Check, MessageSquare, Users, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CoordinatorPermissions = {
  canAddParticipants: boolean;
  canPublishFeed: boolean;
  canUnlockCertificates: boolean;
  canManageSessions: boolean;
};

export const DEFAULT_COORDINATOR_PERMISSIONS: CoordinatorPermissions = {
  canAddParticipants: false,
  canPublishFeed: false,
  canUnlockCertificates: false,
  canManageSessions: false,
};

type PermissionKey = keyof CoordinatorPermissions;

const PERMISSION_OPTIONS: {
  key: PermissionKey;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    key: "canAddParticipants",
    label: "Gérer les participants",
    description: "Ajouter et affecter les participants",
    icon: Users,
  },
  {
    key: "canPublishFeed",
    label: "Publier dans les feed",
    description: "Publier dans les fils de formation",
    icon: MessageSquare,
  },
  {
    key: "canUnlockCertificates",
    label: "Débloquer les attestations",
    description: "Débloquer manuellement les attestations",
    icon: Award,
  },
  {
    key: "canManageSessions",
    label: "Gérer les sessions",
    description: "Planifier et modifier les sessions",
    icon: Calendar,
  },
];

export function CoordinatorPermissionsInline({ value }: { value: CoordinatorPermissions }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PERMISSION_OPTIONS.map(({ key, label }) => {
        const active = value[key];
        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-tight",
              active
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {active ? (
              <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            ) : (
              <X className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            )}
            {label}
          </span>
        );
      })}
    </div>
  );
}

type CoordinatorPermissionsPickerProps = {
  value: CoordinatorPermissions;
  onChange: (value: CoordinatorPermissions) => void;
};

export function CoordinatorPermissionsPicker({
  value,
  onChange,
}: CoordinatorPermissionsPickerProps) {
  function toggle(key: PermissionKey) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {PERMISSION_OPTIONS.map(({ key, label, description, icon: Icon }) => {
        const active = value[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={cn(
              "rounded-xl border p-3 text-left transition-all",
              active
                ? "border-emerald-300 bg-emerald-50 shadow-sm ring-1 ring-emerald-200"
                : "border-border hover:border-emerald-200 hover:bg-muted/40"
            )}
          >
            <Icon
              className={cn(
                "mb-2 h-4 w-4",
                active ? "text-emerald-600" : "text-muted-foreground"
              )}
            />
            <p className={cn("text-sm font-semibold leading-snug", active && "text-emerald-900")}>
              {label}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          </button>
        );
      })}
    </div>
  );
}
