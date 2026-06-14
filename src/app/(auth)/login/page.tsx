import { redirect } from "next/navigation";
import { resolveLandingPathFromUser } from "@/lib/auth/landing";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo-mode";
import { getPlatformSettings } from "@/lib/platform-settings";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(await resolveLandingPathFromUser(user));

  const session = await getSession();
  if (session) redirect("/api/auth/clear-session");

  const settings = await getPlatformSettings();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f5f7] p-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#CD3465]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#0F172A]/10 blur-3xl" />
      <LoginForm
        demoMode={isDemoMode()}
        organizationName={settings.organizationName}
        organizationLogoLightUrl={settings.logoLightUrl}
      />
    </div>
  );
}
