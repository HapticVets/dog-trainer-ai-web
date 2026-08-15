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
      .select("id")
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .maybeSingle();
    if (!dog) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });
    const text = (key: string) => typeof body[key] === "string" ? body[key].trim() || null : null;
    const outcome = ["strong", "improving", "needs_work", "regression_concern"].includes(String(body.outcome)) ? body.outcome : null;
    const { data, error } = await supabaseAdmin.from("admin_training_sessions").update({ status: "completed", what_went_well: text("what_went_well"), challenges: text("challenges"), recovery_notes: text("recovery_notes"), homework: text("homework"), additional_notes: text("additional_notes"), outcome, completed_at: new Date().toISOString() }).eq("id", sessionId).eq("dog_id", id).select("*").maybeSingle();
    if (error || !data) { console.error("Admin session completion error:", error); return NextResponse.json({ error: "Unable to complete the training session." }, { status: 500 }); }
    return NextResponse.json({ session: data });
  } catch (error) { console.error("PATCH admin session crashed:", error); return NextResponse.json({ error: "Unable to complete the training session." }, { status: 500 }); }
}
