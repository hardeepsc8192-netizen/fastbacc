"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { isPlaced, type LogEntry, type Nurse } from "@/lib/types";
import LogFeed from "./LogFeed";
import NurseDetail from "./NurseDetail";
import UnplacedNurses from "./UnplacedNurses";

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

  const placedNurses = nurses.filter(isPlaced);
  const unplacedNurses = nurses.filter((n) => !isPlaced(n));

  return (
    <div className="flex-1 grid grid-rows-2 md:grid-rows-1 grid-cols-1 md:grid-cols-[1fr_360px] min-h-0">
      <div className="h-full min-h-0">
        <NurseMap
          nurses={placedNurses}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
      <aside className="h-full flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-black/10 bg-white">
        <NurseDetail nurse={selectedNurse} history={history} />
        <LogFeed
          entries={logEntries}
          nurses={nurses}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <UnplacedNurses
          nurses={unplacedNurses}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </aside>
    </div>
  );
}
