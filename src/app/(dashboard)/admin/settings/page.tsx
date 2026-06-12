import { Settings } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { getPlatformSettings } from "@/lib/platform-settings";
import { PageHeader } from "@/components/layout/page-header";
import { SetBreadcrumb } from "@/components/layout/breadcrumb-context";
import { SectionBlock } from "@/components/layout/section-block";
import { PlatformSettingsForm } from "@/components/features/admin/platform-settings-form";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-8">
      <SetBreadcrumb items={[{ label: "Paramètres" }]} />
      <PageHeader
        icon={Settings}
        iconVariant="primary"
        title="Paramètres"
        description="Organisation VSCG — logos fond clair et fond sombre"
      />

      <SectionBlock title="Organisation VSCG" countLabel="Configuration globale">
        <div className="px-4 pb-4 pt-3">
          <PlatformSettingsForm initial={settings} />
        </div>
      </SectionBlock>
    </div>
  );
}
