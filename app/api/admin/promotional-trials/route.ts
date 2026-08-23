import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import {
  createPromotionalTrialCode,
  getPuppyTrialLabels,
  getPromotionalTrialUrl,
  type PromotionalTrial,
} from "@/lib/promotionalTrials";
import { supabaseAdmin } from "@/lib/supabase-admin";

const trialColumns = "id, code, trial_days, trial_type, status, campaign_name, organization_name, notes, buyer_email, puppy_id, litter_id, created_at, redeemed_by_email, redeemed_at, expires_at, revoked_at";

const optionalText = (value: unknown, limit: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, limit) : null;

const unauthorizedResponse = (error: unknown) =>
  error instanceof AdminAuthorizationError
    ? NextResponse.json({ error: error.message }, { status: error.status })
    : null;

const withAdminTrialContext = async (trials: PromotionalTrial[]) => {
  const puppyLabels = await getPuppyTrialLabels(
    trials.filter((trial) => trial.trial_type === "puppy_buyer" && Boolean(trial.puppy_id)).map((trial) => trial.puppy_id!),
  );
  return trials.map((trial) => ({
    ...trial,
    redemptionUrl: getPromotionalTrialUrl(trial.code),
    puppyLabel: trial.puppy_id ? puppyLabels.get(trial.puppy_id) ?? null : null,
  }));
};

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from("promotional_trial_codes")
      .select(trialColumns)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const trials = await withAdminTrialContext((data ?? []) as PromotionalTrial[]);
    return NextResponse.json({ trials });
  } catch (error) {
    const authorization = unauthorizedResponse(error);
    if (authorization) return authorization;
    console.error("Admin promotional trial load failed", error);
    return NextResponse.json({ error: "Unable to load trial QR codes. Confirm the promotional trial migration is applied." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin();
    const body = await request.json() as Record<string, unknown>;
    const quantity = Number(body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return NextResponse.json({ error: "Choose a quantity from 1 to 50." }, { status: 400 });
    }

    const records = Array.from({ length: quantity }, () => ({
      code: createPromotionalTrialCode(),
      trial_days: 30,
      trial_type: "general",
      status: "available",
      campaign_name: optionalText(body.campaignName, 120),
      organization_name: optionalText(body.organizationName, 160),
      notes: optionalText(body.notes, 1000),
      created_by_clerk_user_id: adminId,
    }));

    const { data, error } = await supabaseAdmin
      .from("promotional_trial_codes")
      .insert(records)
      .select(trialColumns);

    if (error) throw error;
    const trials = await withAdminTrialContext((data ?? []) as PromotionalTrial[]);
    return NextResponse.json({ trials }, { status: 201 });
  } catch (error) {
    const authorization = unauthorizedResponse(error);
    if (authorization) return authorization;
    console.error("Admin promotional trial creation failed", error);
    return NextResponse.json({ error: "Unable to generate trial QR codes. Confirm the promotional trial migration is applied." }, { status: 500 });
  }
}
