"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import DeleteLitterButton from "@/components/DeleteLitterButton";

type Dog = { id: string; name: string; sex: "male" | "female" };
type Litter = { id: string; litter_code: string; name: string; status: string };

export default function AdminLitters() {
  const [litters, setLitters] = useState<Litter[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ litter_code: "", name: "", sire_dog_id: "", dam_dog_id: "", status: "planned" });
  const sires = dogs.filter((dog) => dog.sex === "male");
  const dams = dogs.filter((dog) => dog.sex === "female");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/litters");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        return;
      }
      setLitters(data.litters);
      setDogs(data.breedingDogs);
    })();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/litters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error);
      return;
    }
    setLitters((current) => [data.litter, ...current]);
  };

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <Link href="/admin" className="text-sm text-amber-200">Back to Admin</Link>
      <h1 className="mt-4 text-3xl font-bold text-white">Litters</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 sm:grid-cols-2">
        <input required placeholder="Litter code" value={form.litter_code} onChange={(event) => setForm({ ...form, litter_code: event.target.value })} className="rounded bg-black p-3" />
        <input required placeholder="Litter name / theme" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded bg-black p-3" />
        <select value={form.sire_dog_id} onChange={(event) => setForm({ ...form, sire_dog_id: event.target.value })} className="rounded bg-black p-3">
          <option value="">{sires.length ? "Select sire" : "No male breeding dogs available"}</option>
          {sires.map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}
        </select>
        <select value={form.dam_dog_id} onChange={(event) => setForm({ ...form, dam_dog_id: event.target.value })} className="rounded bg-black p-3">
          <option value="">{dams.length ? "Select dam" : "No female breeding dogs available"}</option>
          {dams.map((dog) => <option key={dog.id} value={dog.id}>{dog.name}</option>)}
        </select>
        <button className="rounded bg-amber-400 p-3 font-bold text-black">Create Litter</button>
      </form>
      {error && <p className="mt-3 text-red-300" role="alert">{error}</p>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {litters.map((litter) => (
          <article key={litter.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-amber-300">{litter.litter_code}</p>
            <h2 className="font-bold text-white">{litter.name}</h2>
            <p className="text-sm text-neutral-400">{litter.status}</p>
            <div className="mt-4 flex gap-2">
              <Link href={`/admin/litters/${litter.id}`} className="rounded-lg border border-amber-400/35 px-3 py-2 text-sm font-semibold text-amber-100">Open Litter</Link>
              <DeleteLitterButton litterId={litter.id} label="Delete" onDeleted={() => setLitters((current) => current.filter((item) => item.id !== litter.id))} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
