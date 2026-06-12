"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type DemoUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  type: string;
  companyName: string;
  globalRoles: string[];
  projectRoles: { role: string; projectName: string }[];
  isParticipant: boolean;
};

const DEMO_ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "PLANNER", label: "Planner" },
  { value: "TRAINER", label: "Formateur" },
  { value: "COORDINATOR", label: "Coordinateur" },
  { value: "PARTICIPANT", label: "Participant" },
] as const;

type DemoRole = (typeof DEMO_ROLE_OPTIONS)[number]["value"];

function usersForRole(users: DemoUser[], role: DemoRole) {
  switch (role) {
    case "ADMIN":
      return users.filter((u) => u.globalRoles.includes("ADMIN"));
    case "PLANNER":
      return users.filter((u) => u.globalRoles.includes("PLANNER"));
    case "TRAINER":
      return users.filter((u) => u.globalRoles.includes("TRAINER"));
    case "COORDINATOR":
      return users.filter((u) =>
        u.projectRoles.some((r) => r.role === "COORDINATOR")
      );
    case "PARTICIPANT":
      return users.filter((u) => u.isParticipant);
    default:
      return [];
  }
}

type DemoUserSwitcherProps = {
  variant?: "login" | "topbar";
};

export function DemoUserSwitcher({ variant = "topbar" }: DemoUserSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [error, setError] = useState("");
  const [role, setRole] = useState<DemoRole>("ADMIN");
  const [userId, setUserId] = useState("");

  const roleUsers = useMemo(() => usersForRole(users, role), [users, role]);
  const selectedUser = roleUsers.find((u) => u.id === userId);

  async function loadUsers() {
    setError("");
    try {
      const res = await fetch("/api/auth/demo-users", { cache: "no-store" });
      if (!res.ok) {
        setError("Mode démo indisponible.");
        return;
      }
      const data = (await res.json()) as DemoUser[];
      setUsers(data);
      const firstRoleUsers = usersForRole(data, role);
      setUserId(firstRoleUsers[0]?.id ?? "");
      if (data.length === 0) {
        setError("Aucun utilisateur en base de données.");
      }
    } catch {
      setError("Impossible de charger les utilisateurs démo.");
    }
  }

  function handleOpen(next: boolean) {
    setOpen(next);
    if (next) loadUsers();
  }

  function handleRoleChange(nextRole: DemoRole) {
    setRole(nextRole);
    const nextUsers = usersForRole(users, nextRole);
    setUserId(nextUsers[0]?.id ?? "");
  }

  async function handleSwitch() {
    if (!userId) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Connexion démo impossible.");
      return;
    }

    setOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {variant === "login" ? (
          <Button type="button" variant="outline" className="w-full border-dashed">
            <FlaskConical className="h-4 w-4" />
            Mode démo — connexion rapide
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-dashed"
          >
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Démo</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Basculer de compte (démo)</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-muted-foreground">
          Choisissez un rôle puis un utilisateur pour vous connecter sans OTP.
        </p>

        <div className="grid gap-4">
          <SelectField
            id="demo-role"
            label="Rôle"
            value={role}
            onChange={(v) => handleRoleChange(v as DemoRole)}
            options={DEMO_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectField
            id="demo-user"
            label="Utilisateur"
            value={userId}
            onChange={setUserId}
            options={
              roleUsers.length > 0
                ? roleUsers.map((u) => ({
                    value: u.id,
                    label: `${u.firstName} ${u.lastName} (${u.email})`,
                  }))
                : [{ value: "", label: "Aucun utilisateur pour ce rôle" }]
            }
          />

          {selectedUser && (
            <div className="rounded-xl border bg-muted/30 p-3 text-[13px]">
              <p className="font-medium">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-muted-foreground">{selectedUser.email}</p>
              <p className="mt-1 text-muted-foreground">{selectedUser.companyName}</p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="button" disabled={loading || !userId} onClick={handleSwitch}>
            {loading ? "Connexion..." : "Se connecter avec ce compte"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
