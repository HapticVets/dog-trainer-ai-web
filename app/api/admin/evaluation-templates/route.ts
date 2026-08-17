import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isEvaluationConfig } from "@/lib/adminClientEvaluations";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin.from("admin_evaluation_templates").select("*").eq("is_archived", false).order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ templates: data ?? [] });
  } catch (error) {
    console.error("Admin evaluation template load failed", error);
    return NextResponse.json({ error: "Unable to load evaluation templates." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAdmin();
    const body = await request.json() as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() || null : null;
    if (!title || !isEvaluationConfig(body.config)) return NextResponse.json({ error: "A template title and valid evaluation sections are required." }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("admin_evaluation_templates").insert({ title, description, config: body.config, created_by_clerk_user_id: userId }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error("Admin evaluation template create failed", error);
    return NextResponse.json({ error: "Unable to save evaluation template." }, { status: 500 });
  }
}
