"use client";

import type { LogEntry, Nurse } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LogFeed({
  entries,
  nurses,
  selectedId,
  onSelect,
}: {
  entries: LogEntry[];
  nurses: Nurse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const nurseById = new Map(nurses.map((n) => [n.id, n]));

  return (
    <div className="flex flex-col h-full">
      <h2 className="px-4 py-3 text-sm font-semibold text-baylor-green border-b border-black/10">
        Recent changes
      </h2>
      <ul className="flex-1 overflow-y-auto divide-y divide-black/5">
        {entries.map((entry) => {
          const nurse = nurseById.get(entry.nurseId);
          if (!nurse) return null;
          const isSelected = entry.nurseId === selectedId;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect(entry.nurseId)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  isSelected ? "bg-baylor-gold-soft" : "hover:bg-black/5"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-sm text-baylor-green">
                    {nurse.name}
                  </span>
                  <span className="text-xs text-black/50 whitespace-nowrap">
                    {formatDate(entry.date)}
                  </span>
                </div>
                <p className="text-sm text-black/70 mt-0.5">{entry.change}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
