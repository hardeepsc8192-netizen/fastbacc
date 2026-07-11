export type Nurse = {
  id: string;
  name: string;
  hospitalAddress: string;
  lat: number | null;
  lng: number | null;
  hospital: string;
  unit: string;
};

// A nurse with confirmed map coordinates — the narrowed type the map works with.
export type PlacedNurse = Nurse & { lat: number; lng: number };

export function hasRealAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length > 0 && trimmed.toLowerCase() !== "n/a";
}

// Checked against the address, not just lat/lng, so stale coordinates from
// old data (e.g. a placeholder "N/A" address that got geocoded by mistake
// before this check existed) don't put someone on the map incorrectly.
export function isPlaced(nurse: Nurse): nurse is PlacedNurse {
  return (
    nurse.lat != null && nurse.lng != null && hasRealAddress(nurse.hospitalAddress)
  );
}

export type LogEntry = {
  id: string;
  nurseId: string;
  date: string; // ISO date, e.g. "2026-06-01"
  change: string;
};
