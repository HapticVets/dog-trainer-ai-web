import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string }> };

async function puppyExists(litterId: string, puppyId: string) {
  const { data } = await supabaseAdmin.from("admin_litter_puppies").select("id").eq("id", puppyId).eq("litter_id", litterId).maybeSingle();
  return Boolean(data);
}

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id, puppyId } = await params;
    if (!await puppyExists(id, puppyId)) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });
    const { data, error } = await supabaseAdmin.from("admin_puppy_public_development_summaries").select("*").eq("puppy_id", puppyId).order("development_week", { ascending: false });
    if (error) return NextResponse.json({ error: "Public summary schema is not available. Apply the Phase 5A migration." }, { status: 503 });
    return NextResponse.json({ summaries: data ?? [] });
  } catch { return NextResponse.json({ error: "Unable to load public development summaries." }, { status: 500 }); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id, puppyId } = await params;
    if (!await puppyExists(id, puppyId)) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });
    const body = await request.json() as { development_week?: unknown; summary?: unknown; is_public?: unknown };
    const developmentWeek = Number(body.development_week);
    const summary = typeof body.summary === "string" ? body.summary.trim() : "";
    if (!Number.isInteger(developmentWeek) || developmentWeek < 1 || !summary) return NextResponse.json({ error: "Provide a development week and buyer-safe summary." }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("admin_puppy_public_development_summaries").insert({ puppy_id: puppyId, development_week: developmentWeek, summary, is_public: body.is_public === true }).select("*").single();
    if (error) return NextResponse.json({ error: "Unable to save public development summary." }, { status: 500 });
    return NextResponse.json({ summary: data }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to save public development summary." }, { status: 500 }); }
}
