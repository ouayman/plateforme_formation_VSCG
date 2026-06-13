"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgLogo } from "@/components/layout/org-logo";
import { DemoUserSwitcher } from "@/components/auth/demo-user-switcher";
import { BRANDING } from "@/lib/constants";

type LoginFormProps = {
  demoMode?: boolean;
  organizationName?: string;
  organizationLogoLightUrl?: string;
};

export function LoginForm({
  demoMode = false,
  organizationName = "Value Stream Consulting",
  organizationLogoLightUrl = BRANDING.DEFAULT_LOGO_LIGHT,
}: LoginFormProps) {
  const router = useRouter();
  const { refreshCurrentPath } = usePathRefresh();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(
        data.error === "not_invited"
          ? "Accès non autorisé. Contactez votre administrateur."
          : data.error === "rate_limit"
            ? "Trop de tentatives. Réessayez plus tard."
            : "Une erreur est survenue."
      );
      return;
    }

    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Code invalide ou expiré.");
      return;
    }

    router.push("/dashboard");
    refreshCurrentPath();
  }

  return (
    <Card className="relative z-10 w-full max-w-md border-0 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <OrgLogo
            logoUrl={organizationLogoLightUrl}
            alt={organizationName}
            variant="login"
          />
        </div>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          {step === "email"
            ? "Entrez votre email pour recevoir un code"
            : `Code envoyé à ${email}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Recevoir le code"}
            </Button>
            {demoMode && (
              <div className="pt-2">
                <DemoUserSwitcher variant="login" />
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code à 4 chiffres</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="0000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || code.length !== 4}>
              {loading ? "Vérification..." : "Se connecter"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => { setStep("email"); setCode(""); setError(""); }}
            >
              Changer d&apos;email
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
