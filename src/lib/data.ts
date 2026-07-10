import { readFile } from "fs/promises";
import path from "path";
import type { LogEntry, Nurse } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export async function getNurses(): Promise<Nurse[]> {
  const raw = await readFile(path.join(DATA_DIR, "nurses.json"), "utf-8");
  return JSON.parse(raw) as Nurse[];
}

export async function getLogEntries(): Promise<LogEntry[]> {
  const raw = await readFile(path.join(DATA_DIR, "log.json"), "utf-8");
  const entries = JSON.parse(raw) as LogEntry[];
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
