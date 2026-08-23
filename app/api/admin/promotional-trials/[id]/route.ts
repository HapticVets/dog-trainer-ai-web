import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json() as { action?: string };
    if (body.action !== "revoke") {
      return NextResponse.json({ error: "Unsupported trial update." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("promotional_trial_codes")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", id)
      .neq("status", "revoked")
      .select("id, status, revoked_at")
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Trial code not found or already revoked." }, { status: 404 });
    return NextResponse.json({ success: true, trial: data });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Admin promotional trial revoke failed", error);
    return NextResponse.json({ error: "Unable to revoke trial code." }, { status: 500 });
  }
}
