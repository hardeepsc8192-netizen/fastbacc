import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { geocodeAddress } from "@/lib/geocode";
import { readJsonFile, writeJsonFile } from "@/lib/github";
import { hasRealAddress, type LogEntry, type Nurse } from "@/lib/types";

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

type DeleteNurseBody = {
  action: "deleteNurse";
  id: string;
};

type Body =
  | UpsertNurseBody
  | UpsertLogEntryBody
  | DeleteLogEntryBody
  | DeleteNurseBody;

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
      case "deleteNurse":
        return await handleDeleteNurse(body);
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
    if (updated.lat == null) {
      return `Added — not yet placed on the map (${updated.unit}).`;
    }
    return `Added to the map — ${updated.hospital}, ${updated.unit} (${updated.hospitalAddress}).`;
  }

  const changes: string[] = [];
  if (previous.hospital !== updated.hospital) {
    changes.push(`Hospital: ${previous.hospital} → ${updated.hospital}`);
  }
  if (previous.unit !== updated.unit) {
    changes.push(`Unit: ${previous.unit} → ${updated.unit}`);
  }
  if (previous.hospitalAddress !== updated.hospitalAddress) {
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
  if (!nurse.name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const address = nurse.hospitalAddress?.trim() ?? "";
  let lat: number | null = null;
  let lng: number | null = null;

  if (hasRealAddress(address)) {
    const geo = await geocodeAddress(address);
    if (!geo) {
      return NextResponse.json(
        { error: `Could not geocode address: ${address}` },
        { status: 400 }
      );
    }
    lat = geo.lat;
    lng = geo.lng;
  }

  const { data: nurses, sha } = await readJsonFile<Nurse[]>(NURSES_PATH);

  const existingIndex = nurse.id
    ? nurses.findIndex((n) => n.id === nurse.id)
    : -1;
  const previous = existingIndex >= 0 ? nurses[existingIndex] : null;

  const updated: Nurse = {
    id: nurse.id ?? randomUUID(),
    name: nurse.name,
    hospitalAddress: address,
    hospital: nurse.hospital,
    unit: nurse.unit,
    lat,
    lng,
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

async function handleDeleteNurse(body: DeleteNurseBody) {
  if (!body.id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const { data: nurses, sha } = await readJsonFile<Nurse[]>(NURSES_PATH);
  const nurse = nurses.find((n) => n.id === body.id);
  if (!nurse) {
    return NextResponse.json({ error: "Nurse not found." }, { status: 404 });
  }
  const remainingNurses = nurses.filter((n) => n.id !== body.id);

  await writeJsonFile(
    NURSES_PATH,
    remainingNurses,
    sha,
    `admin: delete nurse ${nurse.name}`
  );

  // Cascade: drop this nurse's log entries too, so the feed doesn't show
  // history for someone no longer on the map.
  const { data: logEntries, sha: logSha } = await readJsonFile<LogEntry[]>(LOG_PATH);
  const remainingLog = logEntries.filter((e) => e.nurseId !== body.id);
  if (remainingLog.length !== logEntries.length) {
    await writeJsonFile(
      LOG_PATH,
      remainingLog,
      logSha,
      `admin: remove log entries for deleted nurse ${nurse.name}`
    );
  }

  return NextResponse.json({ ok: true });
}
