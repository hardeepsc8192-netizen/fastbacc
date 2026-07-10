import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { geocodeAddress } from "@/lib/geocode";
import { readJsonFile, writeJsonFile } from "@/lib/github";
import type { LogEntry, Nurse } from "@/lib/types";

const NURSES_PATH = "data/nurses.json";
const LOG_PATH = "data/log.json";

type UpsertNurseBody = {
  action: "upsertNurse";
  nurse: Omit<Nurse, "id" | "lat" | "lng"> & { id?: string };
};

type UpsertLogEntryBody = {
  action: "upsertLogEntry";
  entry: { id?: string; nurseId: string; date: string; change: string };
};

type DeleteLogEntryBody = {
  action: "deleteLogEntry";
  id: string;
};

type Body = UpsertNurseBody | UpsertLogEntryBody | DeleteLogEntryBody;

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "upsertNurse":
        return await handleUpsertNurse(body);
      case "upsertLogEntry":
        return await handleUpsertLogEntry(body);
      case "deleteLogEntry":
        return await handleDeleteLogEntry(body);
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Builds the "old → new" summary for whatever changed, or a first-time intro
// message if this nurse didn't exist before. Returns null if nothing changed.
function describeChange(previous: Nurse | null, updated: Nurse): string | null {
  if (!previous) {
    return `Added to the map — ${updated.hospital}, ${updated.unit} in ${updated.city}, ${updated.state}.`;
  }

  const changes: string[] = [];
  if (previous.hospital !== updated.hospital) {
    changes.push(`Hospital: ${previous.hospital} → ${updated.hospital}`);
  }
  if (previous.unit !== updated.unit) {
    changes.push(`Unit: ${previous.unit} → ${updated.unit}`);
  }
  if (previous.city !== updated.city || previous.state !== updated.state) {
    changes.push(
      `Location: ${previous.city}, ${previous.state} → ${updated.city}, ${updated.state}`
    );
  }
  if (
    changes.length === 0 &&
    previous.hospitalAddress !== updated.hospitalAddress
  ) {
    changes.push(
      `Address: ${previous.hospitalAddress} → ${updated.hospitalAddress}`
    );
  }

  return changes.length > 0 ? changes.join(" · ") : null;
}

async function appendLogEntry(nurseId: string, change: string) {
  const { data: logEntries, sha } = await readJsonFile<LogEntry[]>(LOG_PATH);
  const entry: LogEntry = {
    id: randomUUID(),
    nurseId,
    date: new Date().toISOString().slice(0, 10),
    change,
  };
  logEntries.push(entry);
  await writeJsonFile(LOG_PATH, logEntries, sha, `auto-log: ${change}`);
}

async function handleUpsertNurse(body: UpsertNurseBody) {
  const { nurse } = body;
  if (!nurse.name || !nurse.hospitalAddress) {
    return NextResponse.json(
      { error: "name and hospitalAddress are required." },
      { status: 400 }
    );
  }

  const geo = await geocodeAddress(nurse.hospitalAddress);
  if (!geo) {
    return NextResponse.json(
      { error: `Could not geocode address: ${nurse.hospitalAddress}` },
      { status: 400 }
    );
  }

  const { data: nurses, sha } = await readJsonFile<Nurse[]>(NURSES_PATH);

  const existingIndex = nurse.id
    ? nurses.findIndex((n) => n.id === nurse.id)
    : -1;
  const previous = existingIndex >= 0 ? nurses[existingIndex] : null;

  const updated: Nurse = {
    id: nurse.id ?? randomUUID(),
    name: nurse.name,
    hospitalAddress: nurse.hospitalAddress,
    hospital: nurse.hospital,
    unit: nurse.unit,
    city: nurse.city,
    state: nurse.state,
    lat: geo.lat,
    lng: geo.lng,
  };

  if (existingIndex >= 0) {
    nurses[existingIndex] = updated;
  } else {
    nurses.push(updated);
  }

  await writeJsonFile(
    NURSES_PATH,
    nurses,
    sha,
    `admin: ${existingIndex >= 0 ? "update" : "add"} nurse ${updated.name}`
  );

  const change = describeChange(previous, updated);
  if (change) {
    await appendLogEntry(updated.id, change);
  }

  return NextResponse.json({ ok: true, nurse: updated, loggedChange: change });
}

async function handleUpsertLogEntry(body: UpsertLogEntryBody) {
  const { entry } = body;
  if (!entry.nurseId || !entry.date || !entry.change) {
    return NextResponse.json(
      { error: "nurseId, date, and change are required." },
      { status: 400 }
    );
  }

  const { data: logEntries, sha } = await readJsonFile<LogEntry[]>(LOG_PATH);

  let result: LogEntry;
  if (entry.id) {
    const idx = logEntries.findIndex((e) => e.id === entry.id);
    if (idx === -1) {
      return NextResponse.json({ error: "Log entry not found." }, { status: 404 });
    }
    result = { id: entry.id, nurseId: entry.nurseId, date: entry.date, change: entry.change };
    logEntries[idx] = result;
  } else {
    result = {
      id: randomUUID(),
      nurseId: entry.nurseId,
      date: entry.date,
      change: entry.change,
    };
    logEntries.push(result);
  }

  await writeJsonFile(
    LOG_PATH,
    logEntries,
    sha,
    `admin: ${entry.id ? "update" : "add"} log entry for ${entry.nurseId}`
  );

  return NextResponse.json({ ok: true, entry: result });
}

async function handleDeleteLogEntry(body: DeleteLogEntryBody) {
  if (!body.id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const { data: logEntries, sha } = await readJsonFile<LogEntry[]>(LOG_PATH);
  const filtered = logEntries.filter((e) => e.id !== body.id);
  if (filtered.length === logEntries.length) {
    return NextResponse.json({ error: "Log entry not found." }, { status: 404 });
  }

  await writeJsonFile(LOG_PATH, filtered, sha, `admin: delete log entry ${body.id}`);

  return NextResponse.json({ ok: true });
}
