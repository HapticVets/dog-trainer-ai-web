import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

const internalRecordTypes = ["personal", "client", "breeding"];
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const userId = await requireAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const { data: dog } = await supabaseAdmin.from("dog_profiles").select("id").eq("id", id).in("record_type", internalRecordTypes).maybeSingle();
    if (!dog) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const trainingPlan = typeof body.training_plan === "string" ? body.training_plan.trim() : "";
    if (!title || !trainingPlan) return NextResponse.json({ error: "A title and training plan are required." }, { status: 400 });

    const { data: latest } = await supabaseAdmin.from("admin_training_sessions").select("session_number").eq("dog_id", id).order("session_number", { ascending: false }).limit(1).maybeSingle();
    const sessionNumber = (latest?.session_number ?? 0) + 1;
    const text = (key: string) => typeof body[key] === "string" ? body[key].trim() || null : null;
    const { data, error } = await supabaseAdmin.from("admin_training_sessions").insert({ dog_id: id, created_by_clerk_user_id: userId, session_number: sessionNumber, title, status: "planned", objectives: text("objectives") ?? "", training_plan: trainingPlan, trainer_focus: text("trainer_focus"), progression_goal: text("progression_goal") }).select("*").single();
    if (error || !data) { console.error("Admin session save error:", error); return NextResponse.json({ error: "Unable to save the training session." }, { status: 500 }); }
    return NextResponse.json({ session: data });
  } catch (error) { console.error("POST admin session crashed:", error); return NextResponse.json({ error: "Unable to save the training session." }, { status: 500 }); }
}
