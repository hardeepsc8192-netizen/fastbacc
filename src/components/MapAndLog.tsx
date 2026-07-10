"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { LogEntry, Nurse } from "@/lib/types";
import LogFeed from "./LogFeed";
import NurseDetail from "./NurseDetail";

const NurseMap = dynamic(() => import("./NurseMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-black/40 text-sm">
      Loading map…
    </div>
  ),
});

export default function MapAndLog({
  nurses,
  logEntries,
}: {
  nurses: Nurse[];
  logEntries: LogEntry[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNurse = nurses.find((n) => n.id === selectedId);
  const history = logEntries.filter((e) => e.nurseId === selectedId);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_360px] min-h-0">
      <div className="h-[50vh] md:h-full">
        <NurseMap
          nurses={nurses}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
      <aside className="flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-black/10 bg-white">
        <NurseDetail nurse={selectedNurse} history={history} />
        <LogFeed
          entries={logEntries}
          nurses={nurses}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </aside>
    </div>
  );
}
