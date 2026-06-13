"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BreadcrumbProvider } from "@/components/layout/breadcrumb-context";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { participantRoutes } from "@/lib/routes";

type CompanyOption = { id: string; name: string };

type DashboardShellProps = {
  children: React.ReactNode;
  isAdmin: boolean;
  showPlanning: boolean;
  isParticipantOnly: boolean;
  demoMode: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userAvatarUrl: string | null;
  organizationName: string;
  organizationLogoDarkUrl: string;
  headerLogoUrl: string | null;
  headerLogoAlt: string;
  companyOptions?: CompanyOption[];
  activeCompanyId?: string | null;
};

export function DashboardShell({
  children,
  isAdmin,
  showPlanning,
  isParticipantOnly,
  demoMode,
  userId,
  userName,
  userEmail,
  userFirstName,
  userLastName,
  userAvatarUrl,
  organizationName,
  organizationLogoDarkUrl,
  headerLogoUrl,
  headerLogoAlt,
  companyOptions = [],
  activeCompanyId = null,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarProps = {
    isAdmin,
    showPlanning,
    isParticipantOnly,
    organizationName,
    organizationLogoDarkUrl,
    userId,
    userName,
    userEmail,
    userFirstName,
    userLastName,
    userAvatarUrl,
    companyOptions,
    activeCompanyId,
  };

  return (
    <BreadcrumbProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <div className="flex h-[100dvh] overflow-hidden">
        <div className="hidden shrink-0 lg:flex">
          <Sidebar {...sidebarProps} />
        </div>

        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label="Fermer le menu"
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] shadow-2xl lg:hidden">
              <Sidebar
                {...sidebarProps}
                onNavigate={() => setMobileOpen(false)}
                onClose={() => setMobileOpen(false)}
              />
            </aside>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            demoMode={demoMode}
            headerLogoUrl={headerLogoUrl}
            headerLogoAlt={headerLogoAlt}
            homeHref={isParticipantOnly ? participantRoutes.trainings : "/dashboard"}
            isParticipantOnly={isParticipantOnly}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="main-scroll flex-1 overflow-y-auto overflow-x-hidden bg-[#f5f5f7] p-4 sm:p-6 md:p-8">
            <div className="page-shell">{children}</div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
