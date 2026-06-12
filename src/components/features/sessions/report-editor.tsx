"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDatetime } from "@/lib/format";
import { cn } from "@/lib/utils";

type ReportEditorProps = {
  sessionId: string;
  canEdit: boolean;
  report: {
    content: string;
    createdAt: string;
    trainer: { firstName: string; lastName: string };
  } | null;
};

export function ReportEditor({ sessionId, canEdit, report }: ReportEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(report?.content ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasChanges = content.trim() !== (report?.content ?? "").trim();

  async function handleSave() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/sessions/${sessionId}/report`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Erreur lors de l'enregistrement du compte-rendu.");
      return;
    }

    router.refresh();
  }

  if (!canEdit && !report) {
    return (
      <EmptyState
        icon={FilePenLine}
        title="Aucun compte-rendu"
        description="Le formateur n'a pas encore rédigé le CR."
      />
    );
  }

  return (
    <div className="space-y-4 px-4 pb-2 pt-3">
      {report && (
        <p className="text-[13px] text-muted-foreground">
          Rédigé par {report.trainer.firstName} {report.trainer.lastName} —{" "}
          {formatDatetime(report.createdAt)}
        </p>
      )}

      {canEdit ? (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Compte-rendu de la session : contenu abordé, exercices réalisés, points d'attention..."
            rows={8}
            className={cn(
              "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSave} disabled={loading || !content.trim() || !hasChanges} size="sm">
            {loading ? "Enregistrement..." : "Enregistrer le compte-rendu"}
          </Button>
        </>
      ) : (
        <div className="whitespace-pre-wrap rounded-xl bg-muted/30 px-4 py-3 text-sm">
          {report?.content}
        </div>
      )}
    </div>
  );
}
