"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgLogo } from "@/components/layout/org-logo";
import { BRANDING, PASSWORD } from "@/lib/constants";

type ResetPasswordFormProps = {
  organizationName?: string;
  organizationLogoLightUrl?: string;
};

export function ResetPasswordForm({
  organizationName = "Value Stream Consulting",
  organizationLogoLightUrl = BRANDING.DEFAULT_LOGO_LIGHT,
}: ResetPasswordFormProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!token) {
      setError("Lien invalide ou expiré.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error === "too_short"
          ? `Le mot de passe doit contenir au moins ${PASSWORD.MIN_LENGTH} caractères.`
          : data.error === "invalid"
            ? "Lien invalide ou expiré."
            : "Une erreur est survenue."
      );
      return;
    }

    setDone(true);
  }

  if (!token) {
    return (
      <Card className="relative z-10 w-full max-w-md border-0 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <CardHeader className="text-center">
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>Ce lien de réinitialisation est invalide ou a expiré.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Demander un nouveau lien</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative z-10 w-full max-w-md border-0 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <OrgLogo logoUrl={organizationLogoLightUrl} alt={organizationName} variant="login" />
        </div>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          {done
            ? "Votre mot de passe a été mis à jour."
            : `Minimum ${PASSWORD.MIN_LENGTH} caractères`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <Button asChild className="w-full">
            <Link href="/login">Se connecter</Link>
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD.MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD.MIN_LENGTH}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
