"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Download,
  Lock,
  Search,
  Settings,
  Unlock,
  UserMinus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DropdownPortal, useDropdownAnchor } from "@/components/ui/dropdown-portal";
import { FeedSidebarSection } from "@/components/features/training-feed/feed-sidebar-section";

export type CertificateRow = {
  userId: string;
  status: "locked" | "unlocked";
  attendancePercent: number | null;
  user: { firstName: string; lastName: string; email: string };
};

type FeedParticipantsAdminPanelProps = {
  trainingId: string;
  certificates: CertificateRow[];
  collapsible?: boolean;
  onUnassign?: (userId: string) => void;
  unassignPending?: string | null;
};

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition hover:bg-black/[0.04]",
        destructive ? "text-destructive hover:bg-destructive/5" : "text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      {label}
    </button>
  );
}

export function FeedParticipantsAdminPanel({
  trainingId,
  certificates,
  collapsible = false,
  onUnassign,
  unassignPending,
}: FeedParticipantsAdminPanelProps) {
  const router = useRouter();
  const { anchorRef, setAnchor } = useDropdownAnchor();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [menuKind, setMenuKind] = useState<"bulk" | "user" | null>(null);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const menuOpen = menuKind !== null;

  function closeMenu() {
    setMenuKind(null);
    setMenuUserId(null);
  }

  function openBulkMenu(event: React.MouseEvent<HTMLButtonElement>) {
    if (menuKind === "bulk") {
      closeMenu();
      return;
    }
    setAnchor(event.currentTarget);
    setMenuKind("bulk");
    setMenuUserId(null);
  }

  function openUserMenu(event: React.MouseEvent<HTMLButtonElement>, userId: string) {
    if (menuKind === "user" && menuUserId === userId) {
      closeMenu();
      return;
    }
    setAnchor(event.currentTarget);
    setMenuKind("user");
    setMenuUserId(userId);
  }

  const locked = certificates.filter((c) => c.status === "locked");
  const unlocked = certificates.filter((c) => c.status === "unlocked");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return certificates;
    return certificates.filter((cert) => {
      const haystack =
        `${cert.user.firstName} ${cert.user.lastName} ${cert.user.email}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [certificates, search]);

  async function setCertificateStatus(userId: string, status: "locked" | "unlocked") {
    setPending(userId);
    await fetch(`/api/trainings/${trainingId}/certificates/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(null);
    closeMenu();
    router.refresh();
  }

  async function setAllStatus(status: "locked" | "unlocked", targets: CertificateRow[]) {
    setBulkLoading(true);
    for (const cert of targets) {
      await fetch(`/api/trainings/${trainingId}/certificates/${cert.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    }
    setBulkLoading(false);
    closeMenu();
    router.refresh();
  }

  const activeCert =
    menuKind === "user" && menuUserId
      ? certificates.find((c) => c.userId === menuUserId)
      : null;

  const menuSurfaceClass =
    "overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)]";

  return (
    <FeedSidebarSection
      icon={Users}
      title="Participants"
      count={certificates.length}
      collapsible={collapsible}
      empty={{
        icon: Users,
        message: "Aucun participant inscrit pour le moment.",
      }}
    >
      {certificates.length > 0 && (
        <>
          <div className="flex items-center gap-2 border-b border-surface px-4 py-2.5 sm:px-5">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un participant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-[12px]"
              />
            </div>
            {(locked.length > 0 || unlocked.length > 0) && (
              <div className="shrink-0">
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={openBulkMenu}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-black/[0.04] hover:text-[#CD3465]"
                  title="Actions attestations"
                >
                  <Award className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <DropdownPortal
            open={menuOpen}
            onClose={closeMenu}
            anchorRef={anchorRef}
            align="end"
            className={menuSurfaceClass}
          >
            {menuKind === "bulk" && (
              <>
                {locked.length > 0 && (
                  <MenuItem
                    icon={Unlock}
                    label="Débloquer toutes les attestations"
                    onClick={() => setAllStatus("unlocked", locked)}
                  />
                )}
                {unlocked.length > 0 && (
                  <MenuItem
                    icon={Lock}
                    label="Bloquer toutes les attestations"
                    onClick={() => setAllStatus("locked", unlocked)}
                  />
                )}
              </>
            )}
            {menuKind === "user" && activeCert && (
              <>
                {onUnassign && (
                  <MenuItem
                    icon={UserMinus}
                    label="Retirer de la formation"
                    destructive
                    onClick={() => {
                      closeMenu();
                      onUnassign(activeCert.userId);
                    }}
                  />
                )}
                {activeCert.status === "locked" ? (
                  <MenuItem
                    icon={Unlock}
                    label="Débloquer l'attestation"
                    onClick={() => setCertificateStatus(activeCert.userId, "unlocked")}
                  />
                ) : (
                  <MenuItem
                    icon={Lock}
                    label="Bloquer l'attestation"
                    onClick={() => setCertificateStatus(activeCert.userId, "locked")}
                  />
                )}
              </>
            )}
          </DropdownPortal>

          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-muted-foreground sm:px-5">
              Aucun participant ne correspond à la recherche.
            </p>
          ) : (
            <ul>
              {filtered.map((cert, i) => (
                <li
                  key={cert.userId}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 sm:px-5",
                    i > 0 && "border-t border-surface"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {cert.user.firstName} {cert.user.lastName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{cert.user.email}</p>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      disabled={pending === cert.userId || unassignPending === `rm:${cert.userId}`}
                      onClick={(e) => openUserMenu(e, cert.userId)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground"
                      title="Actions participant"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </FeedSidebarSection>
  );
}

/** @deprecated use FeedParticipantsAdminPanel */
export const FeedCertificateAdminPanel = FeedParticipantsAdminPanel;

type FeedCertificatePanelProps = {
  trainingId: string;
  status: "locked" | "unlocked" | null;
};

export function FeedCertificatePanel({ trainingId, status }: FeedCertificatePanelProps) {
  if (status === "unlocked") {
    return (
      <FeedSidebarSection icon={Award} title="Attestation">
        <div className="px-4 py-4 sm:px-5">
          <a
            href={`/api/trainings/${trainingId}/certificates/me/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#CD3465]/10 px-4 py-2 text-[13px] font-semibold text-[#CD3465] transition hover:bg-[#CD3465]/15"
          >
            <Download className="h-4 w-4" />
            Télécharger mon attestation
          </a>
        </div>
      </FeedSidebarSection>
    );
  }

  return (
    <FeedSidebarSection
      icon={Lock}
      title="Attestation"
      empty={{
        icon: Lock,
        message: "Votre attestation sera disponible à la fin de la formation.",
      }}
    />
  );
}

/** @deprecated use FeedCertificatePanel */
export function FeedCertificateDownload({ trainingId }: { trainingId: string }) {
  return <FeedCertificatePanel trainingId={trainingId} status="unlocked" />;
}
