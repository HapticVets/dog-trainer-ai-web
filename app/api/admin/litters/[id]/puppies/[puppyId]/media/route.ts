import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string }> };
const bucket = "puppy-development-media";
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const categories = new Set(["growth", "training", "environmental", "engagement", "handling", "play", "crate", "other"]);

async function verifyPuppy(litterId: string, puppyId: string) {
  const { data, error } = await supabaseAdmin.from("admin_litter_puppies").select("id").eq("id", puppyId).eq("litter_id", litterId).maybeSingle();
  if (error || !data) return null;
  return data;
}

const signedUrl = async (path: string) => (await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60)).data?.signedUrl ?? null;

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    if (!await verifyPuppy(litterId, puppyId)) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });
    const { data, error } = await supabaseAdmin.from("admin_puppy_media").select("*").eq("litter_id", litterId).eq("puppy_id", puppyId).order("development_week", { ascending: false, nullsFirst: false }).order("captured_at", { ascending: false });
    if (error) { console.error("Admin puppy media load failed", error); return NextResponse.json({ error: error.code === "42P01" || error.code === "PGRST205" ? "Puppy media storage is not ready. Apply the Phase 4.5 migration." : "Unable to load puppy media." }, { status: 500 }); }
    return NextResponse.json({ media: await Promise.all((data ?? []).map(async (item) => ({ ...item, signedUrl: await signedUrl(item.storage_path) }))) });
  } catch (error) { console.error("Admin puppy media load failed", error); return NextResponse.json({ error: "Unable to load puppy media." }, { status: 500 }); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const adminId = await requireAdmin();
    const { id: litterId, puppyId } = await params;
    if (!await verifyPuppy(litterId, puppyId)) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });
    const formData = await request.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    const developmentWeek = Number(formData.get("development_week"));
    const category = String(formData.get("category") ?? "other");
    const caption = String(formData.get("caption") ?? "").trim() || null;
    const evaluationId = String(formData.get("evaluation_id") ?? "").trim() || null;
    if (!files.length || files.length > 10) return NextResponse.json({ error: "Select between 1 and 10 media files." }, { status: 400 });
    if (!Number.isInteger(developmentWeek) || developmentWeek < 1) return NextResponse.json({ error: "Choose a positive development week." }, { status: 400 });
    if (!categories.has(category)) return NextResponse.json({ error: "Choose a valid media category." }, { status: 400 });
    const records: Array<Record<string, unknown>> = [];
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const isImage = imageTypes.has(file.type); const isVideo = videoTypes.has(file.type);
      const limit = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if ((!isImage && !isVideo) || !file.size || file.size > limit) { await supabaseAdmin.storage.from(bucket).remove(uploadedPaths); return NextResponse.json({ error: "Photos must be JPEG, PNG, or WebP up to 10 MB. Videos must be MP4, MOV, or WebM up to 100 MB." }, { status: 400 }); }
      const extension = file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
      const path = `puppy-development/${litterId}/${puppyId}/week-${String(developmentWeek).padStart(2, "0")}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (uploadError) { await supabaseAdmin.storage.from(bucket).remove(uploadedPaths); console.error("Admin puppy media upload failed", uploadError); return NextResponse.json({ error: "Unable to upload development media." }, { status: 500 }); }
      uploadedPaths.push(path);
      records.push({ puppy_id: puppyId, litter_id: litterId, evaluation_id: evaluationId, media_type: isVideo ? "video" : "photo", storage_path: path, development_week: developmentWeek, caption, category, uploaded_by_clerk_user_id: adminId });
    }
    const { data, error } = await supabaseAdmin.from("admin_puppy_media").insert(records).select("*");
    if (error) { await supabaseAdmin.storage.from(bucket).remove(uploadedPaths); console.error("Admin puppy media record failed", error); return NextResponse.json({ error: "Unable to save development media." }, { status: 500 }); }
    return NextResponse.json({ success: true, media: await Promise.all((data ?? []).map(async (item) => ({ ...item, signedUrl: await signedUrl(item.storage_path) }))) }, { status: 201 });
  } catch (error) { console.error("Admin puppy media upload failed", error); return NextResponse.json({ error: "Unable to upload development media." }, { status: 500 }); }
}
