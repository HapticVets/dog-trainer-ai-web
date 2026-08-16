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
    const body = await request.json() as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    if (typeof body.development_week !== "undefined" || typeof body.category !== "undefined") {
      const developmentWeek = Number(body.development_week);
      const category = typeof body.category === "string" ? body.category : "";
      if (!Number.isInteger(developmentWeek) || developmentWeek < 1 || !categories.has(category)) return NextResponse.json({ error: "Provide a valid development week and category." }, { status: 400 });
      update.development_week = developmentWeek;
      update.category = category;
      update.caption = typeof body.caption === "string" && body.caption.trim() ? body.caption.trim() : null;
    }
    if (typeof body.is_public !== "undefined") {
      if (typeof body.is_public !== "boolean") return NextResponse.json({ error: "Public media status must be a boolean." }, { status: 400 });
      update.is_public = body.is_public;
      if (!body.is_public) update.is_public_primary = false;
    }
    if (typeof body.public_caption !== "undefined") {
      if (body.public_caption !== null && typeof body.public_caption !== "string") return NextResponse.json({ error: "Public caption must be text." }, { status: 400 });
      update.public_caption = typeof body.public_caption === "string" ? body.public_caption.trim() || null : null;
    }
    if (typeof body.is_public_primary !== "undefined") {
      if (body.is_public_primary !== true || media.media_type !== "photo") return NextResponse.json({ error: "Only an approved public photo can be primary." }, { status: 400 });
      const { error: clearError } = await supabaseAdmin.from("admin_puppy_media").update({ is_public_primary: false, updated_at: new Date().toISOString() }).eq("puppy_id", puppyId);
      if (clearError) return NextResponse.json({ error: "Unable to select the primary public photo." }, { status: 500 });
      update.is_public = true;
      update.is_public_primary = true;
    }
    if (!Object.keys(update).length) return NextResponse.json({ error: "No supported media fields were provided." }, { status: 400 });
    update.public_updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("admin_puppy_media").update(update).eq("id", mediaId).select("*").single();
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
