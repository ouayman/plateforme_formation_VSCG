"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSoftRefresh } from "@/hooks/use-soft-refresh";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Participant = {
  userId: string;
  firstName: string;
  lastName: string;
  attendanceStatus: "present" | "absent" | null;
};

type AttendanceEditorProps = {
  sessionId: string;
  participants: Participant[];
  canEdit: boolean;
};

export function AttendanceEditor({ sessionId, participants, canEdit }: AttendanceEditorProps) {
  const pathname = usePathname();
  const { refresh } = useSoftRefresh();
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, "present" | "absent" | null>>(
    Object.fromEntries(participants.map((p) => [p.userId, p.attendanceStatus]))
  );

  function setStatus(userId: string, status: "present" | "absent" | null) {
    setStatuses((prev) => ({ ...prev, [userId]: status }));
  }

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/sessions/${sessionId}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attendances: Object.entries(statuses).map(([userId, attendanceStatus]) => ({
          userId,
          attendanceStatus,
        })),
      }),
    });
    setLoading(false);
    refresh(pathname);
  }

  const hasChanges = participants.some((p) => statuses[p.userId] !== p.attendanceStatus);

  return (
    <div className="space-y-4">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Participant</th>
            <th>Émargement</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.userId}>
              <td className="font-medium">
                {p.firstName} {p.lastName}
              </td>
              <td>
                {canEdit ? (
                  <div className="flex gap-2">
                    {(["present", "absent", null] as const).map((s) => (
                      <button
                        key={String(s)}
                        type="button"
                        onClick={() => setStatus(p.userId, s)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          statuses[p.userId] === s
                            ? s === "present"
                              ? "bg-emerald-500/15 text-emerald-700"
                              : s === "absent"
                                ? "bg-red-500/15 text-red-700"
                                : "bg-muted text-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {s === "present" ? "Présent" : s === "absent" ? "Absent" : "—"}
                      </button>
                    ))}
                  </div>
                ) : (
                  <AttendanceBadge status={p.attendanceStatus} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {canEdit && hasChanges && (
        <Button onClick={handleSave} disabled={loading} size="sm">
          {loading ? "Enregistrement..." : "Enregistrer l'émargement"}
        </Button>
      )}
    </div>
  );
}

function AttendanceBadge({ status }: { status: "present" | "absent" | null }) {
  if (status === "present") return <Badge variant="success">Présent</Badge>;
  if (status === "absent") return <Badge variant="outline">Absent</Badge>;
  return <span className="text-muted-foreground">Non renseigné</span>;
}
