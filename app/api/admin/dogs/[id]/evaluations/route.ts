import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isEvaluationConfig } from "@/lib/adminClientEvaluations";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };
async function clientDog(id: string) { return supabaseAdmin.from("dog_profiles").select("id").eq("id", id).eq("record_type", "client").maybeSingle(); }

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireAdmin(); const { id } = await params; const { data: dog } = await clientDog(id);
    if (!dog) return NextResponse.json({ error: "Client Dog record not found." }, { status: 404 });
    const { data, error } = await supabaseAdmin.from("admin_dog_evaluations").select("*").eq("dog_id", id).order("evaluation_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ evaluations: data ?? [] });
  } catch (error) { console.error("Admin client evaluation load failed", error); return NextResponse.json({ error: "Unable to load client evaluations. Confirm the evaluation migration is applied." }, { status: 500 }); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const userId = await requireAdmin(); const { id } = await params; const { data: dog } = await clientDog(id);
    if (!dog) return NextResponse.json({ error: "Client Dog record not found." }, { status: 404 });
    const body = await request.json() as Record<string, unknown>; const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || !isEvaluationConfig(body.config_snapshot) || !body.results || typeof body.results !== "object" || Array.isArray(body.results)) return NextResponse.json({ error: "A title, valid evaluation sections, and observations are required." }, { status: 400 });
    const evaluationDate = typeof body.evaluation_date === "string" && !Number.isNaN(Date.parse(body.evaluation_date)) ? body.evaluation_date : new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("admin_dog_evaluations").insert({ dog_id: id, template_id: typeof body.template_id === "string" ? body.template_id : null, template_name: typeof body.template_name === "string" ? body.template_name.trim() || null : null, title, evaluation_date: evaluationDate, evaluator_clerk_user_id: userId, config_snapshot: body.config_snapshot, results: body.results }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ evaluation: data }, { status: 201 });
  } catch (error) { console.error("Admin client evaluation create failed", error); return NextResponse.json({ error: "Unable to save client evaluation." }, { status: 500 }); }
}
