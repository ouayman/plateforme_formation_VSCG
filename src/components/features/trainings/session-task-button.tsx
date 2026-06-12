"use client";

import Link from "next/link";
import { ClipboardList, FilePenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
  type TaskStatus,
} from "@/lib/session-tasks";

const ICONS = {
  attendance: ClipboardList,
  report: FilePenLine,
} as const;

export type SessionTaskIcon = keyof typeof ICONS;

type SessionTaskButtonProps = {
  href: string;
  label: string;
  status: TaskStatus;
  icon: SessionTaskIcon;
};

export function SessionTaskButton({ href, label, status, icon }: SessionTaskButtonProps) {
  const Icon = ICONS[icon];
  const styles = TASK_STATUS_STYLES[status];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors",
        styles.className
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dotClass)} />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
      <span className="font-normal opacity-80">· {TASK_STATUS_LABELS[status]}</span>
    </Link>
  );
}
