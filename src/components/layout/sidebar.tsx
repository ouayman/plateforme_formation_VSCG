"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Contact,
  FolderKanban,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/layout/org-logo";
import { CompanySwitcher } from "@/components/layout/company-switcher";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";
import { BRANDING } from "@/lib/constants";
import { participantRoutes } from "@/lib/routes";

const staffNavItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/projects", label: "Projets", icon: FolderKanban },
];

const participantNavItems = [
  { href: participantRoutes.trainings, label: "Mes formations", icon: GraduationCap },
  { href: participantRoutes.planning, label: "Mon planning", icon: CalendarDays },
];

const adminItems = [
  { href: "/admin/participants", label: "Participants", icon: Contact },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/trainers", label: "Formateurs", icon: GraduationCap },
  { href: "/admin/skill-domains", label: "Domaines de compétence", icon: Layers },
  { href: "/admin/companies", label: "Entreprises", icon: Building2 },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

type CompanyOption = { id: string; name: string };

type SidebarProps = {
  isAdmin?: boolean;
  showPlanning?: boolean;
  isParticipantOnly?: boolean;
  organizationName?: string;
  organizationLogoDarkUrl?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  userAvatarUrl?: string | null;
  companyOptions?: CompanyOption[];
  activeCompanyId?: string | null;
  onNavigate?: () => void;
  onClose?: () => void;
};

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
        active
          ? "bg-white/10 text-white shadow-sm"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#CD3465]" />
      )}
      <Icon className={cn("h-[18px] w-[18px]", active && "text-[#CD3465]")} />
      {label}
    </Link>
  );
}

const trainerItems = [{ href: "/planning", label: "Planning", icon: CalendarDays }];

export function Sidebar({
  isAdmin = false,
  showPlanning = false,
  isParticipantOnly = false,
  organizationName = "Value Stream Consulting",
  organizationLogoDarkUrl = BRANDING.DEFAULT_LOGO_DARK,
  userId = "",
  userName = "",
  userEmail = "",
  userFirstName = "",
  userLastName = "",
  userAvatarUrl = null,
  companyOptions = [],
  activeCompanyId = null,
  onNavigate,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = isParticipantOnly ? participantNavItems : staffNavItems;
  const homeHref = isParticipantOnly ? participantRoutes.trainings : "/dashboard";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-full w-[260px] flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex min-h-[60px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href={homeHref} className="flex min-w-0 flex-1 items-center" onClick={onNavigate}>
          <OrgLogo
            logoUrl={organizationLogoDarkUrl}
            alt={organizationName}
            variant="sidebar"
          />
        </Link>
        {onClose && (
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isParticipantOnly && companyOptions.length > 1 && activeCompanyId && (
        <CompanySwitcher companies={companyOptions} activeCompanyId={activeCompanyId} />
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
            onNavigate={onNavigate}
          />
        ))}

        {showPlanning && !isParticipantOnly && (
          <>
            <p className="px-3 pb-1 pt-6 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Formateur
            </p>
            {trainerItems.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <p className="px-3 pb-1 pt-6 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Administration
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {userName && userEmail ? (
          <SidebarUserMenu
            userId={userId}
            userName={userName}
            userEmail={userEmail}
            userFirstName={userFirstName}
            userLastName={userLastName}
            avatarUrl={userAvatarUrl}
          />
        ) : null}
      </div>
    </aside>
  );
}
