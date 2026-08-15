import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { STANDARD_COLLAR_COLORS } from "@/lib/admin-puppy-collars";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };
const inactiveStatuses = new Set(["sold", "placed"]);

export async function POST(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);
    const { data: litter, error: litterError } = await supabaseAdmin.from("admin_litters").select("litter_code").eq("id", litterId).maybeSingle();
    if (litterError || !litter) return NextResponse.json({ error: "Litter not found." }, { status: 404 });

    const { data: existing, error: existingError } = await supabaseAdmin.from("admin_litter_puppies").select("puppy_code,collar_color,status").eq("litter_id", litterId).order("puppy_code");
    if (existingError) return NextResponse.json({ error: "Unable to inspect existing puppies." }, { status: 500 });
    const usedCodes = new Set((existing ?? []).map((puppy) => puppy.puppy_code));
    const usedCollars = new Set((existing ?? []).filter((puppy) => puppy.collar_color && !inactiveStatuses.has(puppy.status)).map((puppy) => puppy.collar_color!.toLowerCase()));
    const availableCollars = STANDARD_COLLAR_COLORS.filter((color) => !usedCollars.has(color.toLowerCase()));
    const puppies: Array<Record<string, unknown>> = [];
    let sequence = 1;
    while (puppies.length < count) {
      const puppyCode = `${litter.litter_code}${String(sequence).padStart(2, "0")}`;
      if (!usedCodes.has(puppyCode)) {
        puppies.push({ litter_id: litterId, puppy_code: puppyCode, collar_color: availableCollars[puppies.length] ?? null });
      }
      sequence += 1;
    }
    const { data, error } = await supabaseAdmin.from("admin_litter_puppies").insert(puppies).select("*");
    if (error) {
      console.error("Admin puppy generation failed", { code: error.code, message: error.message, details: error.details, hint: error.hint });
      return NextResponse.json({ error: "Unable to add puppies." }, { status: 500 });
    }
    const unassignedCount = puppies.filter((puppy) => !puppy.collar_color).length;
    return NextResponse.json({ puppies: data ?? [], unassignedCount });
  } catch (error) {
    console.error("Admin puppy generation failed", error);
    return NextResponse.json({ error: "Unable to add puppies." }, { status: 500 });
  }
}
