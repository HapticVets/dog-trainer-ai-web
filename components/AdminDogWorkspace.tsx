"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  dogRecordTypeLabel,
  dogRecordTypes,
  type AdminDogProfile,
  type DogRecordType,
} from "@/lib/adminDogs";
import { hydrateDogCaseFile } from "@/lib/dogCaseFile";

type NewDogForm = {
  name: string;
  breed: string;
  age: string;
  goalType: string;
  mainGoal: string;
  recordType: DogRecordType;
  clientOwnerName: string;
  clientOwnerEmail: string;
  clientOwnerPhone: string;
};

const initialForm: NewDogForm = {
  name: "",
  breed: "",
  age: "",
  goalType: "Behavior Problems",
  mainGoal: "",
  recordType: "personal",
  clientOwnerName: "",
  clientOwnerEmail: "",
  clientOwnerPhone: "",
};

const groupOrder: DogRecordType[] = ["personal", "client", "breeding"];

const fetchAdminDogs = async () => {
  const response = await fetch("/api/admin/dogs", { cache: "no-store" });
  const data = (await response.json()) as { profiles?: AdminDogProfile[]; error?: string };

  if (!response.ok) throw new Error(data.error || "Unable to load internal dog records.");
  return data.profiles ?? [];
};

const DogAvatar = ({ dog }: { dog: AdminDogProfile }) => (
  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-400/25 bg-gradient-to-br from-neutral-800 to-black text-xl font-bold text-amber-200">
    {dog.profile_image_url ? (
      <Image
        src={dog.profile_image_url}
        alt={`${dog.name} profile photo`}
        fill
        sizes="64px"
        className="object-cover"
      />
    ) : (
      dog.name.slice(0, 1).toUpperCase()
    )}
  </div>
);

function DogRecordCard({ dog, onPhotoUpdated }: { dog: AdminDogProfile; onPhotoUpdated: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const caseFile = hydrateDogCaseFile(dog);

  const handlePhotoSelection = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("dogProfileId", dog.id);
    formData.append("image", file);

    try {
      const response = await fetch("/api/dog-profile/photo", { method: "POST", body: formData });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to save dog photo.");
      onPhotoUpdated();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to save dog photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-4">
        <DogAvatar dog={dog} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold text-white">{dog.name}</h3>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200">
              {dogRecordTypeLabel[dog.record_type]}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            {[caseFile.breed, caseFile.age].filter(Boolean).join(" · ") || "Profile details not set"}
          </p>
          {dog.record_type === "client" && dog.client_owner_name && (
            <p className="mt-2 text-sm text-amber-100">Client: {dog.client_owner_name}</p>
          )}
        </div>
      </div>

      {dog.main_goal?.trim() && (
        <div className="mt-5 border-t border-neutral-800 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Training focus</p>
          <p className="mt-1 text-sm text-neutral-200">{dog.main_goal}</p>
        </div>
      )}

      {dog.record_type === "client" && (
        <div className="mt-4 rounded-xl border border-neutral-800 bg-black/30 p-3 text-sm text-neutral-300">
          <p className="font-semibold text-neutral-100">Client contact</p>
          <p className="mt-1">{dog.client_owner_email || "Email not provided"}</p>
          <p>{dog.client_owner_phone || "Phone not provided"}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void handlePhotoSelection(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 transition hover:border-amber-400/50 hover:bg-neutral-900 disabled:cursor-wait disabled:opacity-60"
        >
          {uploading ? "Uploading..." : dog.profile_image_url ? "Replace photo" : "Add photo"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
    </article>
  );
}

export default function AdminDogWorkspace() {
  const [dogs, setDogs] = useState<AdminDogProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewDogForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadDogs = async () => {
    setLoading(true);
    setError("");
    try {
      setDogs(await fetchAdminDogs());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load internal dog records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDogs();
  }, []);

  const updateForm = <Key extends keyof NewDogForm>(key: Key, value: NewDogForm[Key]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/dogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to create internal dog record.");

      setForm(initialForm);
      setShowForm(false);
      setNotice("Internal dog record created.");
      await loadDogs();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create internal dog record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-neutral-950 via-neutral-950 to-amber-950/20 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Internal management</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Patriot K9 Admin</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
              Manage personal, client, and breeding dog records without changing customer training profiles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNotice("");
              setError("");
              setShowForm((current) => !current);
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950"
          >
            {showForm ? "Close form" : "Add Dog"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-7 grid gap-4 border-t border-neutral-800 pt-6 md:grid-cols-2">
            <label className="text-sm font-semibold text-neutral-200">
              Dog name
              <input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white outline-none transition focus:border-amber-400" />
            </label>
            <label className="text-sm font-semibold text-neutral-200">
              Record type
              <select value={form.recordType} onChange={(event) => updateForm("recordType", event.target.value as DogRecordType)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white outline-none transition focus:border-amber-400">
                {dogRecordTypes.map((type) => <option key={type} value={type}>{dogRecordTypeLabel[type]}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-neutral-200">
              Breed
              <input value={form.breed} onChange={(event) => updateForm("breed", event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white outline-none transition focus:border-amber-400" />
            </label>
            <label className="text-sm font-semibold text-neutral-200">
              Age
              <input value={form.age} onChange={(event) => updateForm("age", event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white outline-none transition focus:border-amber-400" />
            </label>
            <label className="text-sm font-semibold text-neutral-200">
              Training category
              <input value={form.goalType} onChange={(event) => updateForm("goalType", event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white outline-none transition focus:border-amber-400" />
            </label>
            <label className="text-sm font-semibold text-neutral-200">
              Training focus (optional)
              <input value={form.mainGoal} onChange={(event) => updateForm("mainGoal", event.target.value)} placeholder="Select training focus (optional)" className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white placeholder:text-neutral-500 outline-none transition focus:border-amber-400" />
            </label>

            {form.recordType === "client" && (
              <div className="md:col-span-2 grid gap-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 md:grid-cols-3">
                <label className="text-sm font-semibold text-neutral-200">Client name<input value={form.clientOwnerName} onChange={(event) => updateForm("clientOwnerName", event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white outline-none transition focus:border-amber-400" /></label>
                <label className="text-sm font-semibold text-neutral-200">Client email<input type="email" value={form.clientOwnerEmail} onChange={(event) => updateForm("clientOwnerEmail", event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white outline-none transition focus:border-amber-400" /></label>
                <label className="text-sm font-semibold text-neutral-200">Client phone<input type="tel" value={form.clientOwnerPhone} onChange={(event) => updateForm("clientOwnerPhone", event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white outline-none transition focus:border-amber-400" /></label>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center md:col-span-2">
              <button type="button" onClick={() => { setShowForm(false); setForm(initialForm); }} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-bold text-neutral-200 transition hover:bg-neutral-900">Cancel</button>
              <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60">{saving ? "Creating..." : "Create dog record"}</button>
            </div>
          </form>
        )}
      </div>

      {notice && <p className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" role="status">{notice}</p>}
      {error && <p className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</p>}

      {loading ? (
        <p className="py-12 text-center text-neutral-400">Loading internal dog records...</p>
      ) : (
        <div className="mt-8 space-y-10">
          {groupOrder.map((recordType) => {
            const groupedDogs = dogs.filter((dog) => dog.record_type === recordType);
            return (
              <section key={recordType} aria-labelledby={`${recordType}-dogs-heading`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Internal records</p>
                    <h2 id={`${recordType}-dogs-heading`} className="mt-2 text-2xl font-bold text-white">{dogRecordTypeLabel[recordType]}s</h2>
                  </div>
                  <span className="rounded-full border border-neutral-700 px-3 py-1 text-sm font-semibold text-neutral-300">{groupedDogs.length}</span>
                </div>
                {groupedDogs.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/50 p-5 text-sm text-neutral-500">No {dogRecordTypeLabel[recordType].toLowerCase()} records yet.</p>
                ) : (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {groupedDogs.map((dog) => <DogRecordCard key={dog.id} dog={dog} onPhotoUpdated={() => void loadDogs()} />)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
