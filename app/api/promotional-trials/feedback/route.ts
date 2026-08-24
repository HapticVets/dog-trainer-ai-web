import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const FEEDBACK_WINDOW_MILLISECONDS = 5 * 86_400_000;
const MAX_COMMENT_LENGTH = 1_000;

type TrialFeedback = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

const missingFeedbackTable = (error: { code?: string } | null) =>
  error?.code === "42P01" || error?.code === "PGRST205";

const getEligibleTrial = async (userId: string) => {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (
    user.publicMetadata?.role === "admin" ||
    user.publicMetadata?.premium === true ||
    user.publicMetadata?.clientAccess === true
  ) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("promotional_trial_codes")
    .select("id, expires_at")
    .eq("status", "redeemed")
    .eq("redeemed_by_clerk_user_id", userId)
    .is("revoked_at", null)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.expires_at) return null;

  const millisecondsRemaining = new Date(data.expires_at).getTime() - Date.now();
  return millisecondsRemaining <= FEEDBACK_WINDOW_MILLISECONDS ? data : null;
};

const getFeedback = async (trialId: string, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("promotional_trial_feedback")
    .select("id, rating, comment, created_at")
    .eq("promotional_trial_code_id", trialId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as TrialFeedback | null;
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trial = await getEligibleTrial(userId);
    if (!trial) return NextResponse.json({ eligible: false, feedback: null });

    return NextResponse.json({ eligible: true, feedback: await getFeedback(trial.id, userId) });
  } catch (error) {
    if (missingFeedbackTable(error as { code?: string })) {
      return NextResponse.json({ eligible: false, feedback: null });
    }
    console.error("Promotional trial feedback lookup failed", error);
    return NextResponse.json({ error: "Unable to load trial feedback." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trial = await getEligibleTrial(userId);
    if (!trial) return NextResponse.json({ error: "Trial feedback is not available for this account." }, { status: 403 });

    const body = await request.json() as { rating?: unknown; comment?: unknown };
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
    }
    if (typeof body.comment !== "undefined" && typeof body.comment !== "string") {
      return NextResponse.json({ error: "Feedback comment must be text." }, { status: 400 });
    }
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, MAX_COMMENT_LENGTH) || null : null;

    const existingFeedback = await getFeedback(trial.id, userId);
    if (existingFeedback) return NextResponse.json({ feedback: existingFeedback, alreadySubmitted: true });

    const { data, error } = await supabaseAdmin
      .from("promotional_trial_feedback")
      .insert({ promotional_trial_code_id: trial.id, clerk_user_id: userId, rating, comment })
      .select("id, rating, comment, created_at")
      .single();

    if (error?.code === "23505") {
      const feedback = await getFeedback(trial.id, userId);
      if (feedback) return NextResponse.json({ feedback, alreadySubmitted: true });
    }
    if (error || !data) throw error || new Error("Feedback insert returned no row.");

    return NextResponse.json({ feedback: data as TrialFeedback }, { status: 201 });
  } catch (error) {
    if (missingFeedbackTable(error as { code?: string })) {
      return NextResponse.json({ error: "Trial feedback is not available yet." }, { status: 503 });
    }
    console.error("Promotional trial feedback submission failed", error);
    return NextResponse.json({ error: "Unable to submit feedback right now." }, { status: 500 });
  }
}
