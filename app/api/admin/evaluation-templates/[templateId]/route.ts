import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isEvaluationConfig } from "@/lib/adminClientEvaluations";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ templateId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { templateId } = await params;
    const body = await request.json() as Record<string, unknown>;
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.title !== "undefined") { if (typeof body.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "Template title is required." }, { status: 400 }); update.title = body.title.trim(); }
    if (typeof body.description !== "undefined") update.description = typeof body.description === "string" ? body.description.trim() || null : null;
    if (typeof body.is_archived !== "undefined") { if (typeof body.is_archived !== "boolean") return NextResponse.json({ error: "Archive status must be a boolean." }, { status: 400 }); update.is_archived = body.is_archived; }
    if (typeof body.config !== "undefined") { if (!isEvaluationConfig(body.config)) return NextResponse.json({ error: "Evaluation sections are invalid." }, { status: 400 }); update.config = body.config; }
    const { data, error } = await supabaseAdmin.from("admin_evaluation_templates").update(update).eq("id", templateId).select("*").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Evaluation template not found." }, { status: 404 });
    return NextResponse.json({ template: data });
  } catch (error) { console.error("Admin evaluation template update failed", error); return NextResponse.json({ error: "Unable to update evaluation template." }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { templateId } = await params;
    // Archive retains future reuse control without affecting immutable historical snapshots.
    const { error } = await supabaseAdmin.from("admin_evaluation_templates").update({ is_archived: true, updated_at: new Date().toISOString() }).eq("id", templateId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) { console.error("Admin evaluation template archive failed", error); return NextResponse.json({ error: "Unable to archive evaluation template." }, { status: 500 }); }
}
