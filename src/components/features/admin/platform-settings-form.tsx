"use client";

import { useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrgLogo } from "@/components/layout/org-logo";
import { ImageUploadField } from "@/components/ui/image-upload-field";

type PlatformSettingsFormProps = {
  initial: {
    organizationName: string;
    logoDarkUrl: string;
    logoLightUrl: string;
    welcomeSignatory: string;
  };
};

export function PlatformSettingsForm({ initial }: PlatformSettingsFormProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }

    refreshCurrentPath();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-sidebar p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Aperçu fond sombre
          </p>
          <OrgLogo
            logoUrl={form.logoDarkUrl}
            alt={form.organizationName}
            variant="sidebar"
            cacheVersion={form.logoDarkUrl}
          />
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Aperçu fond clair
          </p>
          <OrgLogo
            logoUrl={form.logoLightUrl}
            alt={form.organizationName}
            variant="login"
            cacheVersion={form.logoLightUrl}
          />
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="organizationName">Nom de l&apos;organisation</Label>
          <Input
            id="organizationName"
            required
            value={form.organizationName}
            onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeSignatory">Signature des messages de bienvenue</Label>
          <Input
            id="welcomeSignatory"
            required
            value={form.welcomeSignatory}
            onChange={(e) => setForm({ ...form, welcomeSignatory: e.target.value })}
            placeholder="Ayman de VSCG"
          />
          <p className="text-[12px] text-muted-foreground">
            Texte affiché en fin de publication système de bienvenue dans le feed formation.
          </p>
        </div>

        <ImageUploadField
          id="platform-logo-dark"
          label="Logo fond sombre"
          hint="Sidebar et zones à fond foncé. PNG, JPG, WebP ou SVG — max 5 Mo."
          value={form.logoDarkUrl}
          alt={form.organizationName}
          previewVariant="sidebar"
          previewOnDark
          uploadUrl="/api/admin/settings/upload?kind=dark"
          onUploaded={(path) => {
            setForm((prev) => ({ ...prev, logoDarkUrl: path }));
            refreshCurrentPath();
          }}
        />

        <ImageUploadField
          id="platform-logo-light"
          label="Logo fond clair"
          hint="Connexion, header blanc et zones à fond clair. PNG, JPG, WebP ou SVG — max 5 Mo."
          value={form.logoLightUrl}
          alt={form.organizationName}
          previewVariant="login"
          uploadUrl="/api/admin/settings/upload?kind=light"
          onUploaded={(path) => {
            setForm((prev) => ({ ...prev, logoLightUrl: path }));
            refreshCurrentPath();
          }}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        <Settings className="h-4 w-4" />
        {loading ? "Enregistrement..." : "Enregistrer le nom"}
      </Button>
    </form>
  );
}
