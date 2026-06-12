"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronUp, LogOut, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";

type SidebarUserMenuProps = {
  userId: string;
  userName: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  avatarUrl?: string | null;
};

export function SidebarUserMenu({
  userId,
  userName,
  userEmail,
  userFirstName,
  userLastName,
  avatarUrl,
}: SidebarUserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
      >
        <UserAvatar
          userId={userId}
          firstName={userFirstName}
          lastName={userLastName}
          avatarUrl={avatarUrl}
          size={36}
          ringClassName="ring-2 ring-white/20"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{userName}</p>
          <p className="truncate text-[11px] text-white/45">{userEmail}</p>
        </div>
        <ChevronUp
          className={cn(
            "h-4 w-4 shrink-0 text-white/40 transition-transform",
            !open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#111827] shadow-2xl">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
          >
            <UserCircle className="h-4 w-4 text-[#CD3465]" />
            Gérer mon compte
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
