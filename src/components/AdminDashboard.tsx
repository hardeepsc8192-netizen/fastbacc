"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LogEntry, Nurse } from "@/lib/types";

const emptyNurseForm = {
  id: "",
  name: "",
  hospitalAddress: "",
  hospital: "",
  unit: "",
};

const emptyLogForm = {
  id: "",
  nurseId: "",
  date: new Date().toISOString().slice(0, 10),
  change: "",
};

export default function AdminDashboard({
  nurses,
  logEntries,
}: {
  nurses: Nurse[];
  logEntries: LogEntry[];
}) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-baylor-green">Admin</h1>
        <button
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.push("/");
            router.refresh();
          }}
          className="text-sm text-black/50 hover:text-baylor-green"
        >
          Log out
        </button>
      </div>

      <NurseForm nurses={nurses} />
      <LogEntryForm nurses={nurses} logEntries={logEntries} />
    </div>
  );
}

function NurseForm({ nurses }: { nurses: Nurse[] }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyNurseForm);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function selectExisting(id: string) {
    if (!id) {
      setForm(emptyNurseForm);
      return;
    }
    const nurse = nurses.find((n) => n.id === id);
    if (nurse) setForm({ ...emptyNurseForm, ...nurse });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsertNurse",
        nurse: { ...form, id: form.id || undefined },
      }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setStatus(`Error: ${body.error}`);
      return;
    }
    setStatus(
      body.loggedChange
        ? `Saved, and logged: "${body.loggedChange}"`
        : "Saved — no info changed, nothing new to log."
    );
    setForm(emptyNurseForm);
    router.refresh();
  }

  async function handleDelete() {
    if (!form.id) return;
    if (
      !confirm(
        `Delete ${form.name || "this nurse"}? This also deletes their log history.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setStatus(null);
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteNurse", id: form.id }),
    });
    const body = await res.json();
    setDeleting(false);
    if (!res.ok) {
      setStatus(`Error: ${body.error}`);
      return;
    }
    setStatus("Deleted.");
    setForm(emptyNurseForm);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-black/10 rounded-lg p-5 flex flex-col gap-3"
    >
      <div>
        <h2 className="font-semibold text-baylor-green">Add / update a nurse</h2>
        <p className="text-xs text-black/50 mt-0.5">
          Changing hospital, unit, or city automatically adds a log entry
          showing the old → new value.
        </p>
      </div>

      <label className="text-sm font-medium text-black/70">
        Edit existing
        <select
          className="mt-1 w-full rounded-md border border-black/20 px-2 py-1.5 text-sm"
          value={form.id}
          onChange={(e) => selectExisting(e.target.value)}
        >
          <option value="">— New nurse —</option>
          {nurses.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
        required
      />
      <Field
        label="Hospital address"
        value={form.hospitalAddress}
        onChange={(v) => setForm({ ...form, hospitalAddress: v })}
        placeholder="3500 Gaston Ave, Dallas, TX 75246"
        required
      />
      <Field
        label="Hospital name"
        value={form.hospital}
        onChange={(v) => setForm({ ...form, hospital: v })}
      />
      <Field
        label="Unit"
        value={form.unit}
        onChange={(v) => setForm({ ...form, unit: v })}
      />

      {status && (
        <p
          className={`text-sm ${
            status.startsWith("Error") ? "text-red-600" : "text-baylor-green"
          }`}
        >
          {status}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || deleting}
          className="mt-1 self-start rounded-md bg-baylor-green text-white text-sm font-medium px-4 py-2 hover:bg-baylor-green-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save nurse"}
        </button>
        {form.id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleting}
            className="mt-1 self-start rounded-md border border-red-300 text-red-600 text-sm font-medium px-4 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete nurse"}
          </button>
        )}
      </div>
    </form>
  );
}

function LogEntryForm({
  nurses,
  logEntries,
}: {
  nurses: Nurse[];
  logEntries: LogEntry[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyLogForm);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const nurseById = new Map(nurses.map((n) => [n.id, n]));
  const sortedEntries = [...logEntries].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  function selectExisting(id: string) {
    if (!id) {
      setForm(emptyLogForm);
      return;
    }
    const entry = logEntries.find((e) => e.id === id);
    if (entry) setForm({ ...entry });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsertLogEntry",
        entry: { ...form, id: form.id || undefined },
      }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setStatus(`Error: ${body.error}`);
      return;
    }
    setStatus("Saved to the log.");
    setForm(emptyLogForm);
    router.refresh();
  }

  async function handleDelete() {
    if (!form.id) return;
    if (!confirm("Delete this log entry?")) return;
    setDeleting(true);
    setStatus(null);
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteLogEntry", id: form.id }),
    });
    const body = await res.json();
    setDeleting(false);
    if (!res.ok) {
      setStatus(`Error: ${body.error}`);
      return;
    }
    setStatus("Deleted.");
    setForm(emptyLogForm);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-black/10 rounded-lg p-5 flex flex-col gap-3"
    >
      <h2 className="font-semibold text-baylor-green">Log entries</h2>

      <label className="text-sm font-medium text-black/70">
        Edit existing
        <select
          className="mt-1 w-full rounded-md border border-black/20 px-2 py-1.5 text-sm"
          value={form.id}
          onChange={(e) => selectExisting(e.target.value)}
        >
          <option value="">— New entry —</option>
          {sortedEntries.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.date} — {nurseById.get(entry.nurseId)?.name ?? "Unknown"}:{" "}
              {entry.change.slice(0, 40)}
              {entry.change.length > 40 ? "…" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-black/70">
        Nurse
        <select
          required
          className="mt-1 w-full rounded-md border border-black/20 px-2 py-1.5 text-sm"
          value={form.nurseId}
          onChange={(e) => setForm({ ...form, nurseId: e.target.value })}
        >
          <option value="">Select a nurse…</option>
          {nurses.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Date"
        type="date"
        value={form.date}
        onChange={(v) => setForm({ ...form, date: v })}
        required
      />

      <label className="text-sm font-medium text-black/70">
        Change
        <textarea
          required
          rows={3}
          className="mt-1 w-full rounded-md border border-black/20 px-2 py-1.5 text-sm"
          placeholder="Moved from Med-Surg to ICU at Baylor Scott & White Dallas."
          value={form.change}
          onChange={(e) => setForm({ ...form, change: e.target.value })}
        />
      </label>

      {status && (
        <p
          className={`text-sm ${
            status.startsWith("Error") ? "text-red-600" : "text-baylor-green"
          }`}
        >
          {status}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || deleting}
          className="mt-1 self-start rounded-md bg-baylor-green text-white text-sm font-medium px-4 py-2 hover:bg-baylor-green-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : form.id ? "Save changes" : "Add entry"}
        </button>
        {form.id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleting}
            className="mt-1 self-start rounded-md border border-red-300 text-red-600 text-sm font-medium px-4 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete entry"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium text-black/70 flex-1">
      {label}
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-black/20 px-2 py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
