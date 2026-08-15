import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { normalizeCollarColor } from "@/lib/admin-puppy-collars";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string }> };

async function findPuppy(litterId: string, puppyId: string) {
  return supabaseAdmin.from("admin_litter_puppies").select("*").eq("id", puppyId).eq("litter_id", litterId).maybeSingle();
}

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const { data: puppy, error } = await findPuppy(litterId, puppyId);
    if (error) {
      console.error("Admin puppy lookup failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
      return NextResponse.json({ error: "Unable to load puppy record." }, { status: 500 });
    }
    if (!puppy) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });

    const { data: litterPuppies, error: siblingsError } = await supabaseAdmin.from("admin_litter_puppies").select("id,puppy_code,temporary_name,sex,collar_color,status").eq("litter_id", litterId).order("puppy_code");
    if (siblingsError) {
      console.error("Admin puppy sibling lookup failed", { code: siblingsError.code, message: siblingsError.message, details: siblingsError.details, hint: siblingsError.hint });
      return NextResponse.json({ error: "Unable to load litter puppies." }, { status: 500 });
    }
    const index = (litterPuppies ?? []).findIndex((candidate) => candidate.id === puppyId);
    const nextPuppy = index >= 0 ? litterPuppies?.[index + 1] ?? null : null;
    const profileImageUrl = puppy.profile_image_path
      ? (await supabaseAdmin.storage.from("dog-profile-images").createSignedUrl(puppy.profile_image_path, 60 * 60)).data?.signedUrl ?? null
      : null;
    return NextResponse.json({ puppy, nextPuppy, profileImageUrl });
  } catch (error) {
    console.error("Admin puppy load failed", error);
    return NextResponse.json({ error: "Unable to load puppy record." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const { data: puppy, error: lookupError } = await findPuppy(litterId, puppyId);
    if (lookupError || !puppy) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });
    const body = (await request.json()) as { collar_color?: unknown };
    const collarColor = normalizeCollarColor(body.collar_color);
    if (collarColor === undefined) return NextResponse.json({ error: "Collar labels must be 40 characters or fewer." }, { status: 400 });

    if (collarColor && !["sold", "placed"].includes(puppy.status)) {
      const { data: duplicate, error: duplicateError } = await supabaseAdmin.from("admin_litter_puppies").select("id").eq("litter_id", litterId).ilike("collar_color", collarColor).neq("id", puppyId).not("status", "in", "(sold,placed)").maybeSingle();
      if (duplicateError) {
        console.error("Admin collar duplicate lookup failed", { code: duplicateError.code, message: duplicateError.message, details: duplicateError.details, hint: duplicateError.hint });
        return NextResponse.json({ error: "Unable to verify collar assignment." }, { status: 500 });
      }
      if (duplicate) return NextResponse.json({ error: "That collar color is already assigned to another puppy in this litter." }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from("admin_litter_puppies").update({ collar_color: collarColor, updated_at: new Date().toISOString() }).eq("id", puppyId).eq("litter_id", litterId).select("*").single();
    if (error) {
      console.error("Admin collar update failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
      return NextResponse.json({ error: "Unable to update collar." }, { status: 500 });
    }
    return NextResponse.json({ success: true, puppy: data });
  } catch (error) {
    console.error("Admin collar update failed", error);
    return NextResponse.json({ error: "Unable to update collar." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const { data: puppy, error: lookupError } = await findPuppy(litterId, puppyId);
    if (lookupError || !puppy) return NextResponse.json({ success: false, error: "Puppy record not found." }, { status: 404 });

    const { data: media, error: mediaLookupError } = await supabaseAdmin.from("admin_puppy_media").select("id,storage_path").eq("puppy_id", puppyId);
    if (mediaLookupError && mediaLookupError.code !== "42P01" && mediaLookupError.code !== "PGRST205") return NextResponse.json({ success: false, error: "Unable to inspect related puppy media." }, { status: 500 });
    if (media?.length) {
      const { error: mediaDeleteError } = await supabaseAdmin.from("admin_puppy_media").delete().eq("puppy_id", puppyId);
      if (mediaDeleteError) return NextResponse.json({ success: false, error: "Unable to remove related puppy media." }, { status: 500 });
      const { error: mediaStorageError } = await supabaseAdmin.storage.from("puppy-development-media").remove(media.map((item) => item.storage_path));
      if (mediaStorageError) console.error("Admin puppy media storage cleanup failed", mediaStorageError);
    }

    for (const table of ["admin_puppy_weights", "admin_puppy_notes", "admin_puppy_evaluations"]) {
      const { error } = await supabaseAdmin.from(table).delete().eq("puppy_id", puppyId);
      if (error) {
        console.error("Admin puppy child cleanup failed", { table, code: error.code, message: error.message, details: error.details, hint: error.hint });
        return NextResponse.json({ success: false, error: "Unable to remove related puppy records." }, { status: 500 });
      }
    }
    const { data, error } = await supabaseAdmin.from("admin_litter_puppies").delete().eq("id", puppyId).eq("litter_id", litterId).select("id").maybeSingle();
    if (error || !data) return NextResponse.json({ success: false, error: "Unable to delete puppy." }, { status: 500 });
    return NextResponse.json({ success: true, photoCleanupPending: Boolean(puppy.profile_image_path) });
  } catch (error) {
    console.error("Admin puppy delete failed", error);
    return NextResponse.json({ success: false, error: "Unable to delete puppy." }, { status: 500 });
  }
}
