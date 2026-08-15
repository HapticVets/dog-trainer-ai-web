import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    await requireAdmin();
    const [{ data: litters, error }, { data: breedingDogs }] = await Promise.all([
      supabaseAdmin.from("admin_litters").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("dog_profiles").select("id, name").eq("record_type", "breeding").order("name"),
    ]);
    if (error) return NextResponse.json({ error: "Litter schema is not available." }, { status: 503 });
    return NextResponse.json({ litters: litters ?? [], breedingDogs: breedingDogs ?? [] });
  } catch { return NextResponse.json({ error: "Unable to load litters." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAdmin(); const body = await request.json() as Record<string, unknown>;
    const text = (key: string) => typeof body[key] === "string" ? body[key].trim() || null : null;
    const code = text("litter_code"); const name = text("name");
    if (!code || !name) return NextResponse.json({ error: "Litter code and name are required." }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("admin_litters").insert({ litter_code: code, name, sire_dog_id: text("sire_dog_id"), dam_dog_id: text("dam_dog_id"), breeding_date: text("breeding_date"), estimated_due_date: text("estimated_due_date"), birth_date: text("birth_date"), expected_go_home_date: text("expected_go_home_date"), status: text("status") ?? "planned", breeder_notes: text("breeder_notes"), created_by_clerk_user_id: userId }).select("*").single();
    if (error) return NextResponse.json({ error: error.code === "23505" ? "That litter code already exists." : "Unable to create litter." }, { status: 500 });
    return NextResponse.json({ litter: data });
  } catch { return NextResponse.json({ error: "Unable to create litter." }, { status: 500 }); }
}
