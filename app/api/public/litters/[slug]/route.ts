import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ slug: string }> };
const cacheHeaders = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
const mediaBucket = "puppy-development-media";

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  const { data: litter, error } = await supabaseAdmin
    .from("admin_litters")
    .select("id,public_slug,public_title,public_summary,public_status,birth_date,expected_go_home_date,sire_dog_id,dam_dog_id,public_updated_at")
    .eq("is_public", true).eq("public_slug", slug).maybeSingle();
  if (error) {
    console.error("Public litter detail failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Public litter listings are temporarily unavailable." }, { status: 503, headers: cacheHeaders });
  }
  if (!litter) return NextResponse.json({ error: "Litter not found." }, { status: 404, headers: cacheHeaders });

  const [{ data: dogs }, { data: puppies, error: puppiesError }] = await Promise.all([
    supabaseAdmin.from("dog_profiles").select("id,name").in("id", [litter.sire_dog_id, litter.dam_dog_id].filter((id): id is string => Boolean(id))).eq("record_type", "breeding"),
    supabaseAdmin.from("admin_litter_puppies").select("id,collar_color,sex,public_name,public_summary,public_status,public_price,public_color").eq("litter_id", litter.id).eq("is_public", true).order("created_at"),
  ]);
  if (puppiesError) return NextResponse.json({ error: "Public litter puppies are temporarily unavailable." }, { status: 503, headers: cacheHeaders });
  const safePuppies = puppies ?? [];
  const puppyIds = safePuppies.map((puppy) => puppy.id);
  const [{ data: media }, { data: summaries }] = await Promise.all([
    puppyIds.length ? supabaseAdmin.from("admin_puppy_media").select("puppy_id,media_type,storage_path,public_caption,is_public_primary,captured_at").in("puppy_id", puppyIds).eq("is_public", true).order("is_public_primary", { ascending: false }).order("captured_at", { ascending: false }) : Promise.resolve({ data: [] }),
    puppyIds.length ? supabaseAdmin.from("admin_puppy_public_development_summaries").select("puppy_id,development_week,summary,created_at,updated_at").in("puppy_id", puppyIds).eq("is_public", true).order("development_week", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const mediaByPuppy = new Map<string, Array<{ type: string; url: string; caption: string | null; isPrimary: boolean; capturedAt: string }>>();
  for (const item of media ?? []) {
    const { data } = await supabaseAdmin.storage.from(mediaBucket).createSignedUrl(item.storage_path, 60 * 60);
    if (!data?.signedUrl) continue;
    const entries = mediaByPuppy.get(item.puppy_id) ?? [];
    entries.push({ type: item.media_type, url: data.signedUrl, caption: item.public_caption || null, isPrimary: item.is_public_primary, capturedAt: item.captured_at });
    mediaByPuppy.set(item.puppy_id, entries);
  }
  const summariesByPuppy = new Map<string, Array<{ week: number; summary: string; createdAt: string; updatedAt: string }>>();
  for (const item of summaries ?? []) {
    const entries = summariesByPuppy.get(item.puppy_id) ?? [];
    entries.push({ week: item.development_week, summary: item.summary, createdAt: item.created_at, updatedAt: item.updated_at });
    summariesByPuppy.set(item.puppy_id, entries);
  }
  const dogsById = new Map((dogs ?? []).map((dog) => [dog.id, dog.name]));
  return NextResponse.json({
    litter: { slug: litter.public_slug, title: litter.public_title || litter.public_slug, summary: litter.public_summary || null, status: litter.public_status || null, birthDate: litter.birth_date, expectedGoHomeDate: litter.expected_go_home_date, updatedAt: litter.public_updated_at },
    sire: litter.sire_dog_id ? dogsById.get(litter.sire_dog_id) ?? null : null,
    dam: litter.dam_dog_id ? dogsById.get(litter.dam_dog_id) ?? null : null,
    puppies: safePuppies.map((puppy) => {
      const publicMedia = mediaByPuppy.get(puppy.id) ?? [];
      return { collarColor: puppy.collar_color || null, publicName: puppy.public_name || null, sex: puppy.sex || null, color: puppy.public_color || null, status: puppy.public_status || null, price: puppy.public_price ?? null, summary: puppy.public_summary || null, primaryPhoto: publicMedia.find((item) => item.type === "photo" && item.isPrimary)?.url ?? publicMedia.find((item) => item.type === "photo")?.url ?? null, developmentSummaries: summariesByPuppy.get(puppy.id) ?? [], publicMedia };
    }),
  }, { headers: cacheHeaders });
}
