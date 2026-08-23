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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { data: trial, error: lookupError } = await supabaseAdmin
      .from("promotional_trial_codes")
      .select("id, status, revoked_at")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!trial) return NextResponse.json({ error: "Trial record not found." }, { status: 404 });
    if (trial.status !== "revoked" && !trial.revoked_at) {
      return NextResponse.json({ error: "Only revoked trial records can be deleted." }, { status: 409 });
    }

    const { data: deleted, error: deleteError } = await supabaseAdmin
      .from("promotional_trial_codes")
      .delete()
      .eq("id", id)
      .or("status.eq.revoked,revoked_at.not.is.null")
      .select("id")
      .maybeSingle();

    if (deleteError) throw deleteError;
    if (!deleted) {
      return NextResponse.json({ error: "Only revoked trial records can be deleted." }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Admin promotional trial delete failed", error);
    return NextResponse.json({ error: "Unable to delete revoked trial record." }, { status: 500 });
  }
}
