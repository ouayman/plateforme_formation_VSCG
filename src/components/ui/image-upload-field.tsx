"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OrgLogo, type BrandLogoVariant } from "@/components/layout/org-logo";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  alt: string;
  previewVariant?: BrandLogoVariant;
  previewOnDark?: boolean;
  onUploaded: (path: string) => void;
  uploadUrl: string;
};

export function ImageUploadField({
  id,
  label,
  hint,
  value,
  alt,
  previewVariant = "preview",
  previewOnDark = false,
  onUploaded,
  uploadUrl,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cacheVersion, setCacheVersion] = useState(() => Date.now());

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(uploadUrl, { method: "POST", body: formData });
    setUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Erreur lors du chargement.");
      return;
    }

    const data = await res.json();
    const path = data.path as string;
    setCacheVersion(Date.now());
    onUploaded(path);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-4 rounded-2xl border p-4">
        <div
          className={cn(
            "flex min-h-[72px] min-w-[120px] flex-1 items-center justify-start rounded-xl px-3 py-2",
            previewOnDark ? "bg-sidebar" : "bg-muted/30"
          )}
        >
          {value ? (
            <OrgLogo
              logoUrl={value}
              alt={alt}
              variant={previewVariant}
              cacheVersion={cacheVersion}
            />
          ) : (
            <span className="text-[12px] text-muted-foreground">Aucun logo</span>
          )}
        </div>
        <div className="shrink-0">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? "Chargement..." : "Charger une image"}
          </Button>
          {hint && <p className="mt-2 max-w-[220px] text-[12px] text-muted-foreground">{hint}</p>}
          {error && <p className="mt-1 text-[12px] text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
