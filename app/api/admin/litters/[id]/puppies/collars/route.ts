import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { normalizeCollarColor } from "@/lib/admin-puppy-collars";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };
type Puppy = { id: string; collar_color: string | null; status: string };
const inactiveStatuses = new Set(["sold", "placed"]);

function duplicateError() {
  return NextResponse.json({ error: "That collar color is already assigned to another puppy in this litter." }, { status: 400 });
}

export async function PUT(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId } = await params;
    const body = (await request.json()) as { assignments?: Record<string, unknown> };
    if (!body.assignments || typeof body.assignments !== "object") return NextResponse.json({ error: "Collar assignments are required." }, { status: 400 });

    const { data: puppies, error: lookupError } = await supabaseAdmin.from("admin_litter_puppies").select("id,collar_color,status").eq("litter_id", litterId).order("puppy_code");
    if (lookupError) {
      console.error("Admin collar lookup failed", { code: lookupError.code, message: lookupError.message, details: lookupError.details, hint: lookupError.hint });
      return NextResponse.json({ error: "Unable to load litter puppies." }, { status: 500 });
    }

    const puppyById = new Map((puppies ?? []).map((puppy) => [puppy.id, puppy]));
    const assignments = new Map<string, string | null>();
    for (const [puppyId, rawColor] of Object.entries(body.assignments)) {
      if (!puppyById.has(puppyId)) return NextResponse.json({ error: "A collar assignment does not belong to this litter." }, { status: 400 });
      const color = normalizeCollarColor(rawColor);
      if (color === undefined) return NextResponse.json({ error: "Collar labels must be 40 characters or fewer." }, { status: 400 });
      assignments.set(puppyId, color);
    }

    const activeColors = new Map<string, string>();
    for (const puppy of (puppies ?? []) as Puppy[]) {
      if (inactiveStatuses.has(puppy.status)) continue;
      const color = assignments.has(puppy.id) ? assignments.get(puppy.id) : normalizeCollarColor(puppy.collar_color);
      if (!color) continue;
      const key = color.toLowerCase();
      if (activeColors.has(key)) return duplicateError();
      activeColors.set(key, puppy.id);
    }

    for (const [puppyId, collarColor] of assignments) {
      const { error } = await supabaseAdmin.from("admin_litter_puppies").update({ collar_color: collarColor, updated_at: new Date().toISOString() }).eq("id", puppyId).eq("litter_id", litterId);
      if (error) {
        console.error("Admin collar update failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
        return NextResponse.json({ error: "Unable to save collar assignments." }, { status: 500 });
      }
    }
    const { data, error } = await supabaseAdmin.from("admin_litter_puppies").select("*").eq("litter_id", litterId).order("puppy_code");
    if (error) return NextResponse.json({ error: "Collar assignments were saved, but the litter could not be refreshed." }, { status: 500 });
    return NextResponse.json({ success: true, puppies: data ?? [] });
  } catch (error) {
    console.error("Admin bulk collar assignment failed", error);
    return NextResponse.json({ error: "Unable to save collar assignments." }, { status: 500 });
  }
}
