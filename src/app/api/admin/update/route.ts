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

type AddLogEntryBody = {
  action: "addLogEntry";
  nurseId: string;
  date: string;
  change: string;
};

type Body = UpsertNurseBody | AddLogEntryBody;

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    if (body.action === "upsertNurse") {
      return await handleUpsertNurse(body);
    }
    if (body.action === "addLogEntry") {
      return await handleAddLogEntry(body);
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

  return NextResponse.json({ ok: true, nurse: updated });
}

async function handleAddLogEntry(body: AddLogEntryBody) {
  if (!body.nurseId || !body.date || !body.change) {
    return NextResponse.json(
      { error: "nurseId, date, and change are required." },
      { status: 400 }
    );
  }

  const { data: logEntries, sha } = await readJsonFile<LogEntry[]>(LOG_PATH);

  const entry: LogEntry = {
    id: randomUUID(),
    nurseId: body.nurseId,
    date: body.date,
    change: body.change,
  };
  logEntries.push(entry);

  await writeJsonFile(
    LOG_PATH,
    logEntries,
    sha,
    `admin: add log entry for ${body.nurseId}`
  );

  return NextResponse.json({ ok: true, entry });
}
