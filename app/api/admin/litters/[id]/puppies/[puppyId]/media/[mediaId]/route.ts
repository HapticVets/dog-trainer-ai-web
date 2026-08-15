import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string; mediaId: string }> };
const bucket = "puppy-development-media";
const categories = new Set(["growth", "training", "environmental", "engagement", "handling", "play", "crate", "other"]);

async function findMedia(litterId: string, puppyId: string, mediaId: string) {
  return supabaseAdmin.from("admin_puppy_media").select("*").eq("id", mediaId).eq("litter_id", litterId).eq("puppy_id", puppyId).maybeSingle();
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId, mediaId } = await params;
    const { data: media } = await findMedia(litterId, puppyId, mediaId);
    if (!media) return NextResponse.json({ error: "Media item not found." }, { status: 404 });
    const body = await request.json() as { development_week?: unknown; category?: unknown; caption?: unknown };
    const developmentWeek = Number(body.development_week);
    const category = typeof body.category === "string" ? body.category : "";
    if (!Number.isInteger(developmentWeek) || developmentWeek < 1 || !categories.has(category)) return NextResponse.json({ error: "Provide a valid development week and category." }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("admin_puppy_media").update({ development_week: developmentWeek, category, caption: typeof body.caption === "string" && body.caption.trim() ? body.caption.trim() : null }).eq("id", mediaId).select("*").single();
    if (error) return NextResponse.json({ error: "Unable to update media." }, { status: 500 });
    const signedUrl = (await supabaseAdmin.storage.from(bucket).createSignedUrl(data.storage_path, 60 * 60)).data?.signedUrl ?? null;
    return NextResponse.json({ success: true, media: { ...data, signedUrl } });
  } catch (error) { console.error("Admin puppy media update failed", error); return NextResponse.json({ error: "Unable to update media." }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId, mediaId } = await params;
    const { data: media } = await findMedia(litterId, puppyId, mediaId);
    if (!media) return NextResponse.json({ error: "Media item not found." }, { status: 404 });
    const { error } = await supabaseAdmin.from("admin_puppy_media").delete().eq("id", mediaId);
    if (error) return NextResponse.json({ error: "Unable to delete media." }, { status: 500 });
    const { error: storageError } = await supabaseAdmin.storage.from(bucket).remove([media.storage_path]);
    if (storageError) console.error("Admin puppy media storage cleanup failed", storageError);
    return NextResponse.json({ success: true });
  } catch (error) { console.error("Admin puppy media delete failed", error); return NextResponse.json({ error: "Unable to delete media." }, { status: 500 }); }
}
