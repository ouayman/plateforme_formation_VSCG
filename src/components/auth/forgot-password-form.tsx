"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgLogo } from "@/components/layout/org-logo";
import { BRANDING } from "@/lib/constants";

type ForgotPasswordFormProps = {
  organizationName?: string;
  organizationLogoLightUrl?: string;
};

export function ForgotPasswordForm({
  organizationName = "Value Stream Consulting",
  organizationLogoLightUrl = BRANDING.DEFAULT_LOGO_LIGHT,
}: ForgotPasswordFormProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error === "rate_limit"
          ? "Trop de tentatives. Réessayez plus tard."
          : data.error === "email_failed"
            ? "Impossible d'envoyer l'email. Réessayez plus tard."
            : "Une erreur est survenue."
      );
      return;
    }

    setSent(true);
  }

  return (
    <Card className="relative z-10 w-full max-w-md border-0 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <OrgLogo logoUrl={organizationLogoLightUrl} alt={organizationName} variant="login" />
        </div>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          {sent
            ? "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé."
            : "Entrez votre email pour recevoir un lien de réinitialisation"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vérifiez votre boîte mail (et les spams). Le lien expire dans 1 heure.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Retour à la connexion</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien"}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">Retour à la connexion</Link>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
