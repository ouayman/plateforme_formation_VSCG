"use client";

import { useRef, useState } from "react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AVATAR_UPLOAD } from "@/lib/constants";

type ProfileAvatarUploadProps = {
  userId: string;
  firstName: string;
  lastName: string;
  initialAvatarUrl?: string | null;
  uploadUrl: string;
  canRemove?: boolean;
};

export function ProfileAvatarUpload({
  userId,
  firstName,
  lastName,
  initialAvatarUrl,
  uploadUrl,
  canRemove = true,
}: ProfileAvatarUploadProps) {
  const { refreshCurrentPath } = usePathRefresh();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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

    const data = (await res.json()) as { avatarUrl?: string; path?: string };
    setAvatarUrl(data.avatarUrl ?? data.path ?? null);
    refreshCurrentPath();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    if (!avatarUrl) return;
    setUploading(true);
    setError("");
    const res = await fetch(uploadUrl, { method: "DELETE" });
    setUploading(false);
    if (!res.ok) {
      setError("Erreur lors de la suppression.");
      return;
    }
    setAvatarUrl(null);
    refreshCurrentPath();
  }

  const accept = AVATAR_UPLOAD.ALLOWED_EXTENSIONS.map((ext) =>
    ext === ".jpg" ? "image/jpeg" : `image/${ext.slice(1)}`
  ).join(",");

  return (
    <div className="space-y-2">
      <Label>Photo de profil</Label>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border p-4">
        <UserAvatar
          userId={userId}
          firstName={firstName}
          lastName={lastName}
          avatarUrl={avatarUrl}
          size={72}
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
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
            {uploading ? "Chargement..." : "Charger une photo"}
          </Button>
          {canRemove && avatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => void handleRemove()}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          )}
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground">
        PNG, JPG ou WebP — max 4 Mo. L&apos;image est redimensionnée automatiquement.
      </p>
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
