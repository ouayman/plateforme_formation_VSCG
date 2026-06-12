import { countLabel } from "@/lib/format";

type ProgressData = {
  sessionProgress: number;
  attendanceProgress: number;
  completedSessions: number;
  totalSessions: number;
  attendedSessions: number;
};

type FeedBannerProgressProps = {
  mode: "participant" | "sessions";
  progress: ProgressData;
};

export function FeedBannerProgress({ mode, progress }: FeedBannerProgressProps) {
  const sessionsLabel = countLabel(progress.totalSessions, "séance", "séances");

  if (mode === "sessions") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/75">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
            <span
              className="block h-full rounded-full bg-white/90 transition-all"
              style={{ width: `${progress.sessionProgress}%` }}
            />
          </span>
          <span className="tabular-nums">
            {progress.completedSessions}/{progress.totalSessions} {sessionsLabel}
          </span>
        </span>
      </div>
    );
  }

  const presencesLabel = countLabel(progress.attendedSessions, "présence", "présences");

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="inline-flex items-center gap-2 text-[12px] text-white/80">
        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-[#CD3465] to-[#f472b6] transition-all"
            style={{ width: `${progress.sessionProgress}%` }}
          />
        </span>
        <span>
          Avancement{" "}
          <strong className="font-semibold tabular-nums text-white">
            {progress.sessionProgress}%
          </strong>
        </span>
      </span>
      <span className="inline-flex items-center gap-2 text-[12px] text-white/80">
        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-white/70 to-white/90 transition-all"
            style={{ width: `${progress.attendanceProgress}%` }}
          />
        </span>
        <span>
          Présence{" "}
          <strong className="font-semibold tabular-nums text-white">
            {progress.attendanceProgress}%
          </strong>
        </span>
      </span>
      <span className="text-[11px] text-white/50">
        {progress.completedSessions}/{progress.totalSessions} {sessionsLabel} · {presencesLabel}
      </span>
    </div>
  );
}
