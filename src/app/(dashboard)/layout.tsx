import { redirect } from "next/navigation";
import { UserType } from "@prisma/client";
import { loadDashboardShellData } from "@/lib/dashboard-layout-context";
import { isDemoMode } from "@/lib/demo-mode";
import {
  logPrismaRequestSummary,
  runWithPrismaInstrumentationAsync,
} from "@/lib/prisma-instrumentation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ctx } = await runWithPrismaInstrumentationAsync(
    "dashboard-layout",
    () => loadDashboardShellData()
  );
  logPrismaRequestSummary();

  if (!user || !ctx) redirect("/login");

  const isVscg = user.type === UserType.internal;
  const headerLogoUrl =
    !isVscg && user.company.logoUrl ? user.company.logoUrl : null;

  return (
    <DashboardShell
      isAdmin={user.permissions.isAdmin}
      showPlanning={ctx.showPlanning}
      isParticipantOnly={ctx.participantOnly}
      demoMode={isDemoMode()}
      userId={user.id}
      userName={`${user.firstName} ${user.lastName}`}
      userEmail={user.email}
      userFirstName={user.firstName}
      userLastName={user.lastName}
      userAvatarUrl={user.avatarUrl}
      organizationName={ctx.organizationName}
      organizationLogoDarkUrl={ctx.organizationLogoDarkUrl}
      headerLogoUrl={headerLogoUrl}
      headerLogoAlt={user.company.name}
      companyOptions={ctx.companyOptions}
      activeCompanyId={ctx.activeCompanyId}
      canManageClientCompany={ctx.canManageClientCompany}
    >
      {children}
    </DashboardShell>
  );
}
