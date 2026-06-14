"use client";

import { useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/image-upload-field";

type ClientCompanyFormProps = {
  companyId: string;
  initial: {
    name: string;
    logoUrl: string | null;
  };
};

export function ClientCompanyForm({ companyId, initial }: ClientCompanyFormProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState(initial.name);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/account/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Erreur lors de la mise à jour.");
      return;
    }

    setSuccess(true);
    refreshCurrentPath();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
    >
      <div className="border-b bg-gradient-to-r from-[#CD3465]/10 via-transparent to-transparent px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CD3465]/10 text-[#CD3465]">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Informations entreprise</h2>
            <p className="text-[13px] text-muted-foreground">
              Nom et logo visibles par les utilisateurs de votre entreprise.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-8 py-6">
        <div className="space-y-2">
          <Label htmlFor="company-name">Nom de l&apos;entreprise</Label>
          <Input
            id="company-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <ImageUploadField
          id={`client-company-logo-${companyId}`}
          label="Logo fond clair"
          hint="Affiché dans le header pour les utilisateurs de votre entreprise."
          value={logoUrl}
          alt={name || "Entreprise"}
          previewVariant="header"
          uploadUrl={`/api/companies/${companyId}/logo`}
          onUploaded={(path) => {
            setLogoUrl(path);
            refreshCurrentPath();
          }}
          onRemoved={() => {
            setLogoUrl("");
            refreshCurrentPath();
          }}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-600">Entreprise mise à jour.</p>
        )}

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
