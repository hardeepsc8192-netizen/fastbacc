"use client";

import type { Nurse } from "@/lib/types";

export default function UnplacedNurses({
  nurses,
  selectedId,
  onSelect,
}: {
  nurses: Nurse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (nurses.length === 0) return null;

  return (
    <details className="shrink-0 border-t border-black/10 bg-baylor-gold-soft/40">
      <summary className="px-4 py-2 text-xs font-semibold text-baylor-green cursor-pointer select-none">
        Not yet placed on the map ({nurses.length})
      </summary>
      <ul className="max-h-40 overflow-y-auto px-4 pb-3 space-y-1">
        {nurses.map((nurse) => (
          <li key={nurse.id}>
            <button
              type="button"
              onClick={() => onSelect(nurse.id)}
              className={`text-left w-full text-xs rounded px-1.5 py-1 transition-colors ${
                nurse.id === selectedId ? "bg-baylor-gold/40" : "hover:bg-black/5"
              }`}
            >
              <span className="font-medium text-baylor-green">{nurse.name}</span>
              {nurse.unit && (
                <span className="text-black/50"> — {nurse.unit}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
