import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [{ data: litter, error: litterError }, { data: puppies, error: puppiesError }, { data: dogs }, { data: evaluations, error: evaluationsError }] = await Promise.all([
      supabaseAdmin.from("admin_litters").select("*").eq("id", id).maybeSingle(),
      supabaseAdmin.from("admin_litter_puppies").select("*").eq("litter_id", id).order("puppy_code"),
      supabaseAdmin.from("dog_profiles").select("id,name").eq("record_type", "breeding"),
      supabaseAdmin.from("admin_puppy_evaluations").select("puppy_id,evaluation_week,evaluation_date,created_at").eq("litter_id", id).order("evaluation_date", { ascending: false }).order("created_at", { ascending: false }),
    ]);
    if (litterError || !litter) return NextResponse.json({ error: "Litter not found." }, { status: 404 });
    if (puppiesError) return NextResponse.json({ error: "Unable to load litter puppies." }, { status: 500 });

    // A missing Phase 4 table should not make existing litter management unavailable.
    if (evaluationsError && evaluationsError.code !== "42P01" && evaluationsError.code !== "PGRST205") {
      console.error("Admin litter evaluation summary failed", { code: evaluationsError.code, message: evaluationsError.message, details: evaluationsError.details, hint: evaluationsError.hint });
    }
    const summaries = new Map<string, { evaluationCount: number; latestEvaluationWeek: string | null }>();
    for (const evaluation of evaluations ?? []) {
      const summary = summaries.get(evaluation.puppy_id) ?? { evaluationCount: 0, latestEvaluationWeek: null };
      summary.evaluationCount += 1;
      if (!summary.latestEvaluationWeek) summary.latestEvaluationWeek = evaluation.evaluation_week;
      summaries.set(evaluation.puppy_id, summary);
    }
    const puppiesWithEvaluationSummary = (puppies ?? []).map((puppy) => ({ ...puppy, ...(summaries.get(puppy.id) ?? { evaluationCount: 0, latestEvaluationWeek: null }) }));
    return NextResponse.json({ litter, puppies: puppiesWithEvaluationSummary, breedingDogs: dogs ?? [] });
  } catch (error) {
    console.error("Admin litter load failed", error);
    return NextResponse.json({ error: "Unable to load litter." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const publicFields = ["is_public", "public_slug", "public_title", "public_summary", "public_status"];
    const update = Object.fromEntries(Object.entries(body).filter(([key]) => publicFields.includes(key)));
    if (!Object.keys(update).length) return NextResponse.json({ error: "No supported litter fields were provided." }, { status: 400 });
    if (typeof update.is_public !== "undefined" && typeof update.is_public !== "boolean") return NextResponse.json({ error: "Publication status must be a boolean." }, { status: 400 });
    for (const key of ["public_slug", "public_title", "public_summary", "public_status"]) {
      if (typeof update[key] !== "undefined" && update[key] !== null && typeof update[key] !== "string") return NextResponse.json({ error: "Public listing fields must be text." }, { status: 400 });
      if (typeof update[key] === "string") update[key] = update[key].trim() || null;
    }
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("admin_litters").update({ ...update, public_updated_at: now, updated_at: now }).eq("id", id).select("*").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Unable to update litter." }, { status: 500 });
    return NextResponse.json({ litter: data });
  } catch {
    return NextResponse.json({ error: "Unable to update litter." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { data: puppies, error: puppyLookupError } = await supabaseAdmin.from("admin_litter_puppies").select("id,profile_image_path").eq("litter_id", id);
    if (puppyLookupError) return NextResponse.json({ success: false, error: "Unable to inspect litter records." }, { status: 500 });
    const puppyIds = (puppies ?? []).map((puppy) => puppy.id);
    if (puppyIds.length) {
      const { data: media, error: mediaLookupError } = await supabaseAdmin.from("admin_puppy_media").select("storage_path").in("puppy_id", puppyIds);
      if (mediaLookupError && mediaLookupError.code !== "42P01" && mediaLookupError.code !== "PGRST205") return NextResponse.json({ success: false, error: "Unable to inspect related puppy media." }, { status: 500 });
      if (media?.length) {
        const { error: mediaDeleteError } = await supabaseAdmin.from("admin_puppy_media").delete().in("puppy_id", puppyIds);
        if (mediaDeleteError) return NextResponse.json({ success: false, error: "Unable to remove related puppy media." }, { status: 500 });
        const { error: mediaStorageError } = await supabaseAdmin.storage.from("puppy-development-media").remove(media.map((item) => item.storage_path));
        if (mediaStorageError) console.error("Admin litter media storage cleanup failed", mediaStorageError);
      }
    }
    for (const table of ["admin_puppy_weights", "admin_puppy_notes", "admin_puppy_evaluations"]) {
      if (!puppyIds.length) continue;
      const { error } = await supabaseAdmin.from(table).delete().in("puppy_id", puppyIds);
      if (error) {
        console.error("Admin litter child cleanup failed", { table, code: error.code, message: error.message, details: error.details, hint: error.hint });
        return NextResponse.json({ success: false, error: "Unable to remove related puppy records." }, { status: 500 });
      }
    }
    const { error: puppyError } = await supabaseAdmin.from("admin_litter_puppies").delete().eq("litter_id", id);
    if (puppyError) return NextResponse.json({ success: false, error: "Unable to remove puppy records." }, { status: 500 });
    const { data, error } = await supabaseAdmin.from("admin_litters").delete().eq("id", id).select("id").maybeSingle();
    if (error || !data) return NextResponse.json({ success: false, error: "Unable to delete litter." }, { status: 500 });
    return NextResponse.json({ success: true, orphanedPhotoCount: (puppies ?? []).filter((puppy) => puppy.profile_image_path).length });
  } catch (error) {
    console.error("Admin litter delete failed", error);
    return NextResponse.json({ success: false, error: "Unable to delete litter." }, { status: 500 });
  }
}
