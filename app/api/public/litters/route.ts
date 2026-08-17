import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const cacheHeaders = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
const mediaBucket = "puppy-development-media";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Litter = { id: string; is_public: boolean; name: string; litter_code: string; public_slug: string | null; public_title: string | null; public_summary: string | null; public_status: string | null; birth_date: string | null; expected_go_home_date: string | null; sire_dog_id: string | null; dam_dog_id: string | null; public_updated_at: string | null };
type PublicPuppy = { id: string; litter_id: string; public_status: string | null };

export async function GET() {
  const { data: litters, error } = await supabaseAdmin.from("admin_litters").select("id,is_public,name,litter_code,public_slug,public_title,public_summary,public_status,birth_date,expected_go_home_date,sire_dog_id,dam_dog_id,public_updated_at").order("public_updated_at", { ascending: false, nullsFirst: false });
  if (error) { console.error("Public litter list failed", { code: error.code, message: error.message }); return NextResponse.json({ error: "Public litter listings are temporarily unavailable." }, { status: 503, headers: cacheHeaders }); }
  const allLitters = (litters ?? []) as Litter[];
  const litterIds = allLitters.map((litter) => litter.id);
  const { data: puppies, error: puppiesError } = litterIds.length ? await supabaseAdmin.from("admin_litter_puppies").select("id,litter_id,public_status").in("litter_id", litterIds).eq("is_public", true) : { data: [] as PublicPuppy[], error: null };
  if (puppiesError) { console.error("Public litter puppy lookup failed", { code: puppiesError.code, message: puppiesError.message }); return NextResponse.json({ error: "Public litter listings are temporarily unavailable." }, { status: 503, headers: cacheHeaders }); }
  const puppiesByLitter = new Map<string, PublicPuppy[]>();
  for (const puppy of (puppies ?? []) as PublicPuppy[]) (puppiesByLitter.get(puppy.litter_id) ?? puppiesByLitter.set(puppy.litter_id, []).get(puppy.litter_id)!).push(puppy);
  const visibleLitters = allLitters.filter((litter) => litter.is_public || (puppiesByLitter.get(litter.id) ?? []).length > 0);
  const dogIds = visibleLitters.flatMap((litter) => [litter.sire_dog_id, litter.dam_dog_id]).filter((id): id is string => Boolean(id));
  const publicPuppyIds = (puppies ?? []).map((puppy) => puppy.id);
  const [{ data: dogs }, { data: approvedMedia }] = await Promise.all([
    dogIds.length ? supabaseAdmin.from("dog_profiles").select("id,name").in("id", dogIds).eq("record_type", "breeding") : Promise.resolve({ data: [] }),
    publicPuppyIds.length ? supabaseAdmin.from("admin_puppy_media").select("litter_id,storage_path,media_type,is_public_primary,captured_at").in("puppy_id", publicPuppyIds).eq("is_public", true).order("is_public_primary", { ascending: false }).order("captured_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const dogsById = new Map((dogs ?? []).map((dog) => [dog.id, dog.name]));
  const coverByLitter = new Map<string, string>();
  for (const item of approvedMedia ?? []) { if (item.media_type !== "photo" || coverByLitter.has(item.litter_id)) continue; const { data } = await supabaseAdmin.storage.from(mediaBucket).createSignedUrl(item.storage_path, 60 * 60); if (data?.signedUrl) coverByLitter.set(item.litter_id, data.signedUrl); }
  return NextResponse.json({ litters: visibleLitters.map((litter) => { const publicPuppies = puppiesByLitter.get(litter.id) ?? []; const slug = litter.public_slug || slugify(litter.public_title || litter.name) || slugify(litter.litter_code); return { slug, title: litter.public_title || litter.name, sire: litter.sire_dog_id ? dogsById.get(litter.sire_dog_id) ?? null : null, dam: litter.dam_dog_id ? dogsById.get(litter.dam_dog_id) ?? null : null, status: litter.public_status || null, birthDate: litter.birth_date, expectedGoHomeDate: litter.expected_go_home_date, puppyCount: publicPuppies.length, publicPuppyCount: publicPuppies.length, availableCount: publicPuppies.filter((puppy) => puppy.public_status?.toLowerCase() === "available").length, coverImage: coverByLitter.get(litter.id) ?? null, summary: litter.public_summary || null, updatedAt: litter.public_updated_at }; }) }, { headers: cacheHeaders });
}
