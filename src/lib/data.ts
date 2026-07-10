import { readJsonFile } from "./github";
import type { LogEntry, Nurse } from "./types";

const NURSES_PATH = "data/nurses.json";
const LOG_PATH = "data/log.json";

export async function getNurses(): Promise<Nurse[]> {
  const { data } = await readJsonFile<Nurse[]>(NURSES_PATH);
  return data;
}

export async function getLogEntries(): Promise<LogEntry[]> {
  const { data } = await readJsonFile<LogEntry[]>(LOG_PATH);
  return data.sort((a, b) => b.date.localeCompare(a.date));
}
