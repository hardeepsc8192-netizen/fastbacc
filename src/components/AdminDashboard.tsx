"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Nurse } from "@/lib/types";

const emptyNurseForm = {
  id: "",
  name: "",
  hospitalAddress: "",
  hospital: "",
  unit: "",
  city: "",
  state: "",
};

export default function AdminDashboard({ nurses }: { nurses: Nurse[] }) {
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
      <LogEntryForm nurses={nurses} />
    </div>
  );
}

function NurseForm({ nurses }: { nurses: Nurse[] }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyNurseForm);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setStatus("Saved — committed to GitHub. Vercel will redeploy shortly.");
    setForm(emptyNurseForm);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-black/10 rounded-lg p-5 flex flex-col gap-3"
    >
      <h2 className="font-semibold text-baylor-green">Add / update a nurse</h2>

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
      <div className="flex gap-3">
        <Field
          label="City"
          value={form.city}
          onChange={(v) => setForm({ ...form, city: v })}
        />
        <Field
          label="State"
          value={form.state}
          onChange={(v) => setForm({ ...form, state: v })}
        />
      </div>

      {status && (
        <p
          className={`text-sm ${
            status.startsWith("Error") ? "text-red-600" : "text-baylor-green"
          }`}
        >
          {status}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 self-start rounded-md bg-baylor-green text-white text-sm font-medium px-4 py-2 hover:bg-baylor-green-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save nurse"}
      </button>
    </form>
  );
}

function LogEntryForm({ nurses }: { nurses: Nurse[] }) {
  const router = useRouter();
  const [nurseId, setNurseId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [change, setChange] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addLogEntry", nurseId, date, change }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setStatus(`Error: ${body.error}`);
      return;
    }
    setStatus("Saved — committed to GitHub. Vercel will redeploy shortly.");
    setChange("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-black/10 rounded-lg p-5 flex flex-col gap-3"
    >
      <h2 className="font-semibold text-baylor-green">Add a log entry</h2>

      <label className="text-sm font-medium text-black/70">
        Nurse
        <select
          required
          className="mt-1 w-full rounded-md border border-black/20 px-2 py-1.5 text-sm"
          value={nurseId}
          onChange={(e) => setNurseId(e.target.value)}
        >
          <option value="">Select a nurse…</option>
          {nurses.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </label>

      <Field label="Date" type="date" value={date} onChange={setDate} required />

      <label className="text-sm font-medium text-black/70">
        Change
        <textarea
          required
          rows={3}
          className="mt-1 w-full rounded-md border border-black/20 px-2 py-1.5 text-sm"
          placeholder="Moved from Med-Surg to ICU at Baylor Scott & White Dallas."
          value={change}
          onChange={(e) => setChange(e.target.value)}
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

      <button
        type="submit"
        disabled={loading}
        className="mt-1 self-start rounded-md bg-baylor-green text-white text-sm font-medium px-4 py-2 hover:bg-baylor-green-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Saving…" : "Add entry"}
      </button>
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
