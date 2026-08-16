import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const cacheHeaders = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
const mediaBucket = "puppy-development-media";

type PublicLitter = {
  id: string; public_slug: string; public_title: string | null; public_summary: string | null; public_status: string | null;
  birth_date: string | null; expected_go_home_date: string | null; sire_dog_id: string | null; dam_dog_id: string | null; public_updated_at: string | null;
};

export async function GET() {
  const { data: litters, error } = await supabaseAdmin
    .from("admin_litters")
    .select("id,public_slug,public_title,public_summary,public_status,birth_date,expected_go_home_date,sire_dog_id,dam_dog_id,public_updated_at")
    .eq("is_public", true)
    .not("public_slug", "is", null)
    .order("public_updated_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Public litter list failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Public litter listings are temporarily unavailable." }, { status: 503, headers: cacheHeaders });
  }

  const publishedLitters = (litters ?? []) as PublicLitter[];
  const litterIds = publishedLitters.map((litter) => litter.id);
  const dogIds = publishedLitters.flatMap((litter) => [litter.sire_dog_id, litter.dam_dog_id]).filter((id): id is string => Boolean(id));
  const [{ data: puppies }, { data: dogs }] = await Promise.all([
    litterIds.length ? supabaseAdmin.from("admin_litter_puppies").select("id,litter_id,public_status").in("litter_id", litterIds).eq("is_public", true) : Promise.resolve({ data: [] }),
    dogIds.length ? supabaseAdmin.from("dog_profiles").select("id,name").in("id", dogIds).eq("record_type", "breeding") : Promise.resolve({ data: [] }),
  ]);
  const dogsById = new Map((dogs ?? []).map((dog) => [dog.id, dog.name]));
  const puppiesByLitter = new Map<string, Array<{ id: string; public_status: string | null }>>();
  for (const puppy of puppies ?? []) (puppiesByLitter.get(puppy.litter_id) ?? puppiesByLitter.set(puppy.litter_id, []).get(puppy.litter_id)!).push(puppy);
  const publicPuppyIds = (puppies ?? []).map((puppy) => puppy.id);
  const { data: approvedMedia } = publicPuppyIds.length
    ? await supabaseAdmin.from("admin_puppy_media").select("litter_id,storage_path,media_type,is_public_primary,captured_at").in("puppy_id", publicPuppyIds).eq("is_public", true).order("is_public_primary", { ascending: false }).order("captured_at", { ascending: false })
    : { data: [] };
  const coverByLitter = new Map<string, string>();
  for (const item of approvedMedia ?? []) {
    if (item.media_type !== "photo" || coverByLitter.has(item.litter_id)) continue;
    const { data } = await supabaseAdmin.storage.from(mediaBucket).createSignedUrl(item.storage_path, 60 * 60);
    if (data?.signedUrl) coverByLitter.set(item.litter_id, data.signedUrl);
  }

  return NextResponse.json({ litters: publishedLitters.map((litter) => {
    const puppiesForLitter = puppiesByLitter.get(litter.id) ?? [];
    return {
      slug: litter.public_slug,
      title: litter.public_title || litter.public_slug,
      sire: litter.sire_dog_id ? dogsById.get(litter.sire_dog_id) ?? null : null,
      dam: litter.dam_dog_id ? dogsById.get(litter.dam_dog_id) ?? null : null,
      status: litter.public_status || null,
      birthDate: litter.birth_date,
      expectedGoHomeDate: litter.expected_go_home_date,
      puppyCount: puppiesForLitter.length,
      availableCount: puppiesForLitter.filter((puppy) => puppy.public_status?.toLowerCase() === "available").length,
      coverImage: coverByLitter.get(litter.id) ?? null,
      summary: litter.public_summary || null,
      updatedAt: litter.public_updated_at,
    };
  }) }, { headers: cacheHeaders });
}
