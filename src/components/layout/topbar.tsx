"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { TopbarBreadcrumb } from "@/components/layout/topbar-breadcrumb";
import { DemoUserSwitcher } from "@/components/auth/demo-user-switcher";
import { OrgLogo } from "@/components/layout/org-logo";
import { staffRoutes } from "@/lib/routes";

type TopbarProps = {
  demoMode?: boolean;
  headerLogoUrl?: string | null;
  headerLogoAlt?: string;
  homeHref?: string;
  isParticipantOnly?: boolean;
  onMenuClick?: () => void;
};

export function Topbar({
  demoMode = false,
  headerLogoUrl,
  headerLogoAlt = "Entreprise",
  homeHref = staffRoutes.home,
  isParticipantOnly = false,
  onMenuClick,
}: TopbarProps) {
  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-white/80 px-4 backdrop-blur-md sm:px-6 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {headerLogoUrl && (
          <Link
            href={homeHref}
            className="flex shrink-0 items-center border-r border-border/50 pr-4"
            title={headerLogoAlt}
          >
            <OrgLogo
              logoUrl={headerLogoUrl}
              alt={headerLogoAlt}
              variant="header"
            />
          </Link>
        )}
        <TopbarBreadcrumb isParticipantOnly={isParticipantOnly} />
      </div>
      {demoMode && (
        <div className="flex shrink-0 items-center">
          <DemoUserSwitcher variant="topbar" />
        </div>
      )}
    </header>
  );
}
