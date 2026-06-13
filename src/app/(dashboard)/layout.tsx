import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { DashboardShellLoaded } from "@/components/layout/dashboard-shell-loaded";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";
import DashboardLoading from "@/app/(dashboard)/loading";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Suspense fallback={<DashboardShellSkeleton user={user} />}>
      <DashboardShellLoaded user={user}>
        <Suspense fallback={<DashboardLoading />}>{children}</Suspense>
      </DashboardShellLoaded>
    </Suspense>
  );
}
