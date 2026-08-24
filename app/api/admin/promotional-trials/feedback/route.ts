import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from("promotional_trial_feedback")
      .select("id, promotional_trial_code_id, rating, comment, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ feedback: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Admin promotional trial feedback load failed", error);
    return NextResponse.json({ error: "Unable to load trial feedback. Confirm the feedback migration is applied." }, { status: 500 });
  }
}
