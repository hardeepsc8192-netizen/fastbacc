"use client";

import { useEffect, useRef, useState } from "react";
import type { LogEntry, Nurse } from "@/lib/types";

const PAGE_SIZE = 25;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);

  // Entries changed (e.g. an admin edit came in) — start over from the top
  // page. Adjusting state during render, not an effect, per React's guidance
  // for resetting state in response to a prop change.
  const [trackedEntries, setTrackedEntries] = useState(entries);
  if (entries !== trackedEntries) {
    setTrackedEntries(entries);
    setVisibleCount(PAGE_SIZE);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      ([sentinelEntry]) => {
        if (sentinelEntry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, entries.length));
        }
      },
      { root, rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [entries.length]);

  const visibleEntries = entries.slice(0, visibleCount);
  const hasMore = visibleCount < entries.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="px-4 py-3 text-sm font-semibold text-baylor-green border-b border-black/10 shrink-0">
        Recent changes
      </h2>
      <ul ref={listRef} className="flex-1 min-h-0 overflow-y-auto divide-y divide-black/5">
        {visibleEntries.map((entry) => {
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
        {hasMore && (
          <li ref={sentinelRef} className="px-4 py-3 text-center text-xs text-black/40">
            Loading more…
          </li>
        )}
        {entries.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-black/40">
            No changes logged yet.
          </li>
        )}
      </ul>
    </div>
  );
}
