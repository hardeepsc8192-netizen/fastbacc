"use client";

import type { LogEntry, Nurse } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NurseDetail({
  nurse,
  history,
}: {
  nurse: Nurse | undefined;
  history: LogEntry[];
}) {
  if (!nurse) {
    return (
      <div className="px-4 py-4 border-b border-black/10 text-sm text-black/50">
        Click a pin on the map, or a name in the log, to see more.
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-b border-black/10 bg-baylor-gold-soft/60">
      <p className="font-semibold text-baylor-green">{nurse.name}</p>
      <p className="text-sm text-black/70">{nurse.hospital}</p>
      <p className="text-sm text-black/70">{nurse.unit}</p>
      <p className="text-xs text-black/50 mt-1">{nurse.hospitalAddress}</p>
      {history.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-baylor-green/80 uppercase tracking-wide">
            History
          </p>
          <ul className="mt-1 space-y-1">
            {history.map((entry) => (
              <li key={entry.id} className="text-xs text-black/60">
                <span className="text-black/40">{formatDate(entry.date)}</span>{" "}
                — {entry.change}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
