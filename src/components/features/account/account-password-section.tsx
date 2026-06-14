"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD } from "@/lib/constants";

type AccountPasswordSectionProps = {
  hasPassword: boolean;
};

export function AccountPasswordSection({ hasPassword }: AccountPasswordSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(hasPassword ? { currentPassword: form.currentPassword } : {}),
        newPassword: form.newPassword,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        current_required: "Indiquez votre mot de passe actuel.",
        invalid_current: "Mot de passe actuel incorrect.",
        too_short: `Minimum ${PASSWORD.MIN_LENGTH} caractères.`,
      };
      setError(messages[data.error] || "Erreur lors de la mise à jour.");
      return;
    }

    setSuccess(true);
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
    >
      <div className="border-b bg-gradient-to-r from-[#CD3465]/10 via-transparent to-transparent px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CD3465]/10 text-[#CD3465]">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Mot de passe</h2>
            <p className="text-sm text-muted-foreground">
              {hasPassword
                ? "Modifiez votre mot de passe de connexion"
                : "Définissez un mot de passe pour vous connecter sans code email"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-8">
        {hasPassword && (
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="account-new-password">
            {hasPassword ? "Nouveau mot de passe" : "Mot de passe"}
          </Label>
          <Input
            id="account-new-password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD.MIN_LENGTH}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="account-confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD.MIN_LENGTH}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm font-medium text-emerald-600">Mot de passe mis à jour.</p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : hasPassword ? "Changer le mot de passe" : "Définir le mot de passe"}
        </Button>
      </div>
    </form>
  );
}
