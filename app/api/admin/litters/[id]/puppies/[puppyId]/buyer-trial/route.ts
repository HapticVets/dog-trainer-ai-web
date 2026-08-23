import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import {
  createPromotionalTrialCode,
  getPromotionalTrialUrl,
  normalizePromotionalTrialEmail,
  type PromotionalTrial,
} from "@/lib/promotionalTrials";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string }> };

const trialColumns = "id, code, trial_days, trial_type, status, buyer_email, created_at, redeemed_by_email, redeemed_at, expires_at, revoked_at";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loadPuppy = async (litterId: string, puppyId: string) =>
  supabaseAdmin
    .from("admin_litter_puppies")
    .select("id, litter_id, puppy_code, collar_color, public_name")
    .eq("id", puppyId)
    .eq("litter_id", litterId)
    .maybeSingle();

const formatTrial = (trial: PromotionalTrial) => ({
  ...trial,
  redemptionUrl: getPromotionalTrialUrl(trial.code),
});

const getCurrentTrial = async (puppyId: string) =>
  supabaseAdmin
    .from("promotional_trial_codes")
    .select(trialColumns)
    .eq("trial_type", "puppy_buyer")
    .eq("puppy_id", puppyId)
    .in("status", ["available", "redeemed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

const unavailableResponse = () =>
  NextResponse.json({ error: "Unable to manage this buyer trial. Confirm the promotional trial migrations are applied." }, { status: 500 });

const failureResponse = (error: unknown) => {
  if (error instanceof AdminAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return unavailableResponse();
};

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const { data: puppy, error: puppyError } = await loadPuppy(litterId, puppyId);
    if (puppyError) throw puppyError;
    if (!puppy) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });

    const { data: trial, error: trialError } = await getCurrentTrial(puppyId);
    if (trialError) throw trialError;
    return NextResponse.json({ trial: trial ? formatTrial(trial as PromotionalTrial) : null });
  } catch (error) {
    console.error("Admin puppy buyer trial load failed", error);
    return failureResponse(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const adminId = await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const body = await request.json() as { buyerEmail?: unknown };
    const buyerEmail = typeof body.buyerEmail === "string" ? normalizePromotionalTrialEmail(body.buyerEmail) : "";
    if (!emailPattern.test(buyerEmail)) {
      return NextResponse.json({ error: "Enter a valid buyer email address." }, { status: 400 });
    }

    const { data: puppy, error: puppyError } = await loadPuppy(litterId, puppyId);
    if (puppyError) throw puppyError;
    if (!puppy) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });

    const { data: existing, error: existingError } = await getCurrentTrial(puppyId);
    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json({ error: "This puppy already has an active buyer trial invitation.", trial: formatTrial(existing as PromotionalTrial) }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("promotional_trial_codes")
      .insert({
        code: createPromotionalTrialCode(),
        trial_days: 30,
        trial_type: "puppy_buyer",
        status: "available",
        buyer_email: buyerEmail,
        puppy_id: puppy.id,
        litter_id: puppy.litter_id,
        created_by_clerk_user_id: adminId,
      })
      .select(trialColumns)
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: concurrentTrial } = await getCurrentTrial(puppyId);
        if (concurrentTrial) {
          return NextResponse.json({ error: "This puppy already has an active buyer trial invitation.", trial: formatTrial(concurrentTrial as PromotionalTrial) }, { status: 409 });
        }
      }
      throw error;
    }
    return NextResponse.json({ trial: formatTrial(data as PromotionalTrial) }, { status: 201 });
  } catch (error) {
    console.error("Admin puppy buyer trial creation failed", error);
    return failureResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const body = await request.json() as { buyerEmail?: unknown };
    const buyerEmail = typeof body.buyerEmail === "string" ? normalizePromotionalTrialEmail(body.buyerEmail) : "";
    if (!emailPattern.test(buyerEmail)) {
      return NextResponse.json({ error: "Enter a valid buyer email address." }, { status: 400 });
    }

    const { data: puppy, error: puppyError } = await loadPuppy(litterId, puppyId);
    if (puppyError) throw puppyError;
    if (!puppy) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from("promotional_trial_codes")
      .update({ buyer_email: buyerEmail })
      .eq("trial_type", "puppy_buyer")
      .eq("puppy_id", puppyId)
      .eq("status", "available")
      .select(trialColumns)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Only an available buyer trial can have its email updated." }, { status: 409 });
    return NextResponse.json({ trial: formatTrial(data as PromotionalTrial) });
  } catch (error) {
    console.error("Admin puppy buyer trial email update failed", error);
    return failureResponse(error);
  }
}
