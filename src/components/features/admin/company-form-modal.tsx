"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUploadField } from "@/components/ui/image-upload-field";

type Company = {
  id: string;
  name: string;
  type: "client";
  logoUrl?: string | null;
};

type CompanyFormModalProps = {
  company?: Company;
  mode?: "create" | "edit";
  trigger?: React.ReactNode;
};

export function CompanyFormModal({
  company,
  mode = "create",
  trigger,
}: CompanyFormModalProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && !!company;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(company?.name ?? "");
  const [logoUrl, setLogoUrl] = useState(company?.logoUrl ?? "");
  const [companyId, setCompanyId] = useState(company?.id ?? "");

  function openModal() {
    setName(company?.name ?? "");
    setLogoUrl(company?.logoUrl ?? "");
    setCompanyId(company?.id ?? "");
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(isEdit ? `/api/companies/${company!.id}` : "/api/companies", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "client" }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }

    if (!isEdit) {
      const created = await res.json();
      setCompanyId(created.id);
      router.refresh();
      return;
    }

    setOpen(false);
    router.refresh();
  }

  const uploadCompanyId = isEdit ? company!.id : companyId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={openModal}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouvelle entreprise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'entreprise" : "Nouvelle entreprise cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nom</Label>
            <Input
              id="company-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {uploadCompanyId ? (
            <ImageUploadField
              id={`company-logo-${uploadCompanyId}`}
              label="Logo fond clair"
              hint="Visible dans le header blanc par les utilisateurs de cette entreprise."
              value={logoUrl || ""}
              alt={name || "Entreprise"}
              previewVariant="header"
              uploadUrl={`/api/companies/${uploadCompanyId}/logo`}
              onUploaded={(path) => {
                setLogoUrl(path);
                router.refresh();
              }}
            />
          ) : (
            <p className="text-[12px] text-muted-foreground">
              Enregistrez d&apos;abord l&apos;entreprise pour charger un logo.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateCompanyModal(props: Omit<CompanyFormModalProps, "mode">) {
  return <CompanyFormModal {...props} mode="create" />;
}

export function CompanyEditButton({
  company,
}: {
  company: Company;
}) {
  return (
    <CompanyFormModal
      company={company}
      mode="edit"
      trigger={
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
