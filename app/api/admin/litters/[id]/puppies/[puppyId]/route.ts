import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
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
    return NextResponse.json({ puppy, nextPuppy });
  } catch (error) {
    console.error("Admin puppy load failed", error);
    return NextResponse.json({ error: "Unable to load puppy record." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const { data: puppy, error: lookupError } = await findPuppy(litterId, puppyId);
    if (lookupError || !puppy) return NextResponse.json({ success: false, error: "Puppy record not found." }, { status: 404 });

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
