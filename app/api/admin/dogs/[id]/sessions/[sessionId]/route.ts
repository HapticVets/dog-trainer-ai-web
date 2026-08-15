import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string; sessionId: string }> };
const internalRecordTypes = ["personal", "client", "breeding"];

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id, sessionId } = await params;
    const body = await request.json() as Record<string, unknown>;
    const { data: dog } = await supabaseAdmin
      .from("dog_profiles")
      .select("id, record_type")
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .maybeSingle();
    if (!dog) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });
    const text = (key: string) => typeof body[key] === "string" ? body[key].trim() || null : null;
    const outcome = ["strong", "improving", "needs_work", "regression_concern"].includes(String(body.outcome)) ? body.outcome : null;
    const shareHomework = dog.record_type === "client" && body.share_homework === true;
    const homeworkFocus = text("homework_focus");
    const homeworkNotes = text("homework_notes");

    let clientLink: { customer_dog_profile_id: string | null } | null = null;
    if (shareHomework) {
      if (!homeworkFocus) return NextResponse.json({ error: "Client homework focus is required when sharing homework." }, { status: 400 });
      const { data: link, error: linkError } = await supabaseAdmin.from("admin_client_dog_links")
        .select("customer_dog_profile_id").eq("admin_dog_id", id).maybeSingle();
      if (linkError || !link?.customer_dog_profile_id) return NextResponse.json({ error: "Link the client account and dog profile before sharing homework." }, { status: 400 });
      clientLink = link;
    }
    const { data, error } = await supabaseAdmin.from("admin_training_sessions").update({ status: "completed", what_went_well: text("what_went_well"), challenges: text("challenges"), recovery_notes: text("recovery_notes"), homework: text("homework"), additional_notes: text("additional_notes"), outcome, completed_at: new Date().toISOString() }).eq("id", sessionId).eq("dog_id", id).select("*").maybeSingle();
    if (error || !data) { console.error("Admin session completion error:", error); return NextResponse.json({ error: "Unable to complete the training session." }, { status: 500 }); }
    if (shareHomework && clientLink?.customer_dog_profile_id) {
      const { error: deactivateError } = await supabaseAdmin.from("client_homework_context")
        .update({ active: false }).eq("customer_dog_profile_id", clientLink.customer_dog_profile_id).eq("active", true);
      if (deactivateError) { console.error("Client homework deactivation failed", deactivateError); return NextResponse.json({ error: "Session completed, but homework could not be shared." }, { status: 500 }); }
      const { error: homeworkError } = await supabaseAdmin.from("client_homework_context").insert({ admin_dog_id: id, customer_dog_profile_id: clientLink.customer_dog_profile_id, source_admin_session_id: data.id, homework_focus: homeworkFocus, homework_notes: homeworkNotes, active: true });
      if (homeworkError) { console.error("Client homework sync failed", homeworkError); return NextResponse.json({ error: "Session completed, but homework could not be shared." }, { status: 500 }); }
    }
    return NextResponse.json({ session: data });
  } catch (error) { console.error("PATCH admin session crashed:", error); return NextResponse.json({ error: "Unable to complete the training session." }, { status: 500 }); }
}
