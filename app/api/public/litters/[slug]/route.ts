import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ slug: string }> };
// Availability changes must be visible to the breeding site on its next request.
export const dynamic = "force-dynamic";
const cacheHeaders = { "Cache-Control": "no-store, max-age=0" };
const mediaBucket = "puppy-development-media";
const profileBucket = "dog-profile-images";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function signedUrl(bucket: string, path: string, label: string) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) { console.warn("Public puppy photo signing failed", { bucket: label, message: error.message }); return null; }
  return data?.signedUrl ?? null;
}

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  const { data: litterCandidates, error } = await supabaseAdmin.from("admin_litters").select("id,is_public,name,litter_code,public_slug,public_title,public_summary,public_status,birth_date,expected_go_home_date,sire_dog_id,dam_dog_id,public_updated_at");
  if (error) { console.error("Public litter detail failed", { code: error.code, message: error.message }); return NextResponse.json({ error: "Public litter listings are temporarily unavailable." }, { status: 503, headers: cacheHeaders }); }
  const litter = (litterCandidates ?? []).find((candidate) => (candidate.public_slug || slugify(candidate.public_title || candidate.name) || slugify(candidate.litter_code)) === slug);
  if (!litter) return NextResponse.json({ error: "Litter not found." }, { status: 404, headers: cacheHeaders });
  const { data: puppies, error: puppiesError } = await supabaseAdmin.from("admin_litter_puppies").select("id,collar_color,sex,profile_image_path,public_name,public_summary,public_status,public_price,public_color").eq("litter_id", litter.id).eq("is_public", true).order("created_at");
  if (puppiesError) return NextResponse.json({ error: "Public litter puppies are temporarily unavailable." }, { status: 503, headers: cacheHeaders });
  const safePuppies = puppies ?? [];
  if (!litter.is_public && safePuppies.length === 0) return NextResponse.json({ error: "Litter not found." }, { status: 404, headers: cacheHeaders });
  const puppyIds = safePuppies.map((puppy) => puppy.id);
  const [{ data: dogs }, { data: media }, { data: summaries }] = await Promise.all([
    supabaseAdmin.from("dog_profiles").select("id,name").in("id", [litter.sire_dog_id, litter.dam_dog_id].filter((id): id is string => Boolean(id))).eq("record_type", "breeding"),
    puppyIds.length ? supabaseAdmin.from("admin_puppy_media").select("puppy_id,media_type,storage_path,public_caption,is_public_primary,category,development_week,captured_at").in("puppy_id", puppyIds).eq("is_public", true).order("is_public_primary", { ascending: false }).order("captured_at", { ascending: false }) : Promise.resolve({ data: [] }),
    puppyIds.length ? supabaseAdmin.from("admin_puppy_public_development_summaries").select("puppy_id,development_week,summary").in("puppy_id", puppyIds).eq("is_public", true).order("development_week", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const mediaByPuppy = new Map<string, Array<{ type: string; url: string; caption: string | null; category: string | null; developmentWeek: number | null; capturedAt: string; isPrimary: boolean }>>();
  for (const item of media ?? []) { const url = await signedUrl(mediaBucket, item.storage_path, "development-media"); if (!url) continue; const entries = mediaByPuppy.get(item.puppy_id) ?? []; entries.push({ type: item.media_type, url, caption: item.public_caption || null, category: item.category || null, developmentWeek: item.development_week, capturedAt: item.captured_at, isPrimary: item.is_public_primary }); mediaByPuppy.set(item.puppy_id, entries); }
  const summariesByPuppy = new Map<string, Array<{ developmentWeek: number; summary: string }>>();
  for (const item of summaries ?? []) { const entries = summariesByPuppy.get(item.puppy_id) ?? []; entries.push({ developmentWeek: item.development_week, summary: item.summary }); summariesByPuppy.set(item.puppy_id, entries); }
  const dogsById = new Map((dogs ?? []).map((dog) => [dog.id, dog.name]));
  const publicSlug = litter.public_slug || slugify(litter.public_title || litter.name) || slugify(litter.litter_code);
  const puppyRecords = await Promise.all(safePuppies.map(async (puppy) => { const media = mediaByPuppy.get(puppy.id) ?? []; const explicitPrimary = media.find((item) => item.type === "photo" && item.isPrimary)?.url ?? null; const primaryPhoto = explicitPrimary || (puppy.profile_image_path ? await signedUrl(profileBucket, puppy.profile_image_path, "profile-photo") : null); return { slug: slugify(puppy.public_name || puppy.collar_color || "puppy"), collarColor: puppy.collar_color || null, publicName: puppy.public_name || null, sex: puppy.sex || null, color: puppy.public_color || null, status: puppy.public_status || null, price: puppy.public_price ?? null, summary: puppy.public_summary || null, primaryPhoto, developmentSummaries: summariesByPuppy.get(puppy.id) ?? [], media }; }));
  const availableCount = puppyRecords.filter((puppy) => puppy.status?.toLowerCase() === "available").length;
  return NextResponse.json({ litter: { slug: publicSlug, title: litter.public_title || litter.name, status: litter.public_status || null, summary: litter.public_summary || null, sire: litter.sire_dog_id ? dogsById.get(litter.sire_dog_id) ?? null : null, dam: litter.dam_dog_id ? dogsById.get(litter.dam_dog_id) ?? null : null, birthDate: litter.birth_date, expectedGoHomeDate: litter.expected_go_home_date, publicPuppyCount: puppyRecords.length, availableCount, updatedAt: litter.public_updated_at }, puppies: puppyRecords }, { headers: cacheHeaders });
}
