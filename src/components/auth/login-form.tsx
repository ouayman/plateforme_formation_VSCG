"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail } from "lucide-react";
import { usePathRefresh } from "@/hooks/use-path-refresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgLogo } from "@/components/layout/org-logo";
import { DemoUserSwitcher } from "@/components/auth/demo-user-switcher";
import { BRANDING, PASSWORD } from "@/lib/constants";

type LoginFormProps = {
  demoMode?: boolean;
  organizationName?: string;
  organizationLogoLightUrl?: string;
};

type Step = "identify" | "auth" | "otp";

export function LoginForm({
  demoMode = false,
  organizationName = "Value Stream Consulting",
  organizationLogoLightUrl = BRANDING.DEFAULT_LOGO_LIGHT,
}: LoginFormProps) {
  const router = useRouter();
  const { refreshCurrentPath } = usePathRefresh();
  const [step, setStep] = useState<Step>("identify");
  const [email, setEmail] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error === "not_invited"
          ? "Accès non autorisé. Contactez votre administrateur."
          : "Une erreur est survenue."
      );
      return;
    }

    const data = await res.json();
    setHasPassword(Boolean(data.hasPassword));
    setAuthMethod(data.hasPassword ? "password" : "otp");
    setStep("auth");
  }

  async function handleLoginPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "no_password") {
        setError("Aucun mot de passe défini. Utilisez un code par email.");
        setAuthMethod("otp");
        return;
      }
      setError("Email ou mot de passe incorrect.");
      return;
    }

    router.push("/dashboard");
    refreshCurrentPath();
  }

  async function handleSendOtp() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/send-otp", {
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

  function resetToIdentify() {
    setStep("identify");
    setPassword("");
    setCode("");
    setError("");
  }

  const description =
    step === "identify"
      ? "Entrez votre email pour vous connecter"
      : step === "otp"
        ? `Code envoyé à ${email}`
        : `Connexion pour ${email}`;

  return (
    <Card className="relative z-10 w-full max-w-md border-0 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <OrgLogo logoUrl={organizationLogoLightUrl} alt={organizationName} variant="login" />
        </div>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "identify" && (
          <form onSubmit={handleIdentify} className="space-y-4">
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
              {loading ? "Vérification..." : "Continuer"}
            </Button>
            {demoMode && (
              <div className="pt-2">
                <DemoUserSwitcher variant="login" />
              </div>
            )}
          </form>
        )}

        {step === "auth" && (
          <div className="space-y-4">
            <Tabs
              value={authMethod}
              onValueChange={(value) => setAuthMethod(value as "password" | "otp")}
            >
              <TabsList>
                <TabsTrigger value="password" className="flex-1">
                  <KeyRound className="h-4 w-4" />
                  Mot de passe
                </TabsTrigger>
                <TabsTrigger value="otp" className="flex-1">
                  <Mail className="h-4 w-4" />
                  Code email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <form onSubmit={handleLoginPassword} className="space-y-4">
                  {!hasPassword && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Aucun mot de passe défini. Utilisez un code par email ou{" "}
                      <Link href="/forgot-password" className="font-medium underline">
                        définissez-en un
                      </Link>
                      .
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={hasPassword}
                      disabled={!hasPassword}
                      autoFocus={hasPassword}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !hasPassword}
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="otp">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Un code à 4 chiffres sera envoyé à votre adresse email.
                  </p>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    type="button"
                    className="w-full"
                    disabled={loading}
                    onClick={handleSendOtp}
                  >
                    {loading ? "Envoi..." : "Recevoir le code"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button type="button" variant="ghost" className="w-full" onClick={resetToIdentify}>
              Changer d&apos;email
            </Button>
          </div>
        )}

        {step === "otp" && (
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
                className="text-center font-mono text-2xl tracking-[0.5em]"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || code.length !== 4}>
              {loading ? "Vérification..." : "Se connecter"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleSendOtp}
            >
              Renvoyer le code
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("auth");
                setAuthMethod("otp");
                setCode("");
                setError("");
              }}
            >
              Autre méthode de connexion
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
