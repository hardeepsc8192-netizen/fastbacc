export type Nurse = {
  id: string;
  name: string;
  hospitalAddress: string;
  lat: number;
  lng: number;
  hospital: string;
  unit: string;
};

export type LogEntry = {
  id: string;
  nurseId: string;
  date: string; // ISO date, e.g. "2026-06-01"
  change: string;
};
