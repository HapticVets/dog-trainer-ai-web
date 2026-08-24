import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import {
  createPromotionalTrialCode,
  getPromotionalTrialUrl,
  type PromotionalTrial,
} from "@/lib/promotionalTrials";
import {
  isMissingPromotionalTrialConversionsTable,
  type PromotionalTrialConversionEvent,
} from "@/lib/promotionalTrialConversions";
import { supabaseAdmin } from "@/lib/supabase-admin";

const trialColumns = "id, code, trial_days, trial_type, status, campaign_name, organization_name, notes, buyer_email, puppy_id, litter_id, created_at, redeemed_by_email, redeemed_at, expires_at, revoked_at";

const optionalText = (value: unknown, limit: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, limit) : null;

const unauthorizedResponse = (error: unknown) =>
  error instanceof AdminAuthorizationError
    ? NextResponse.json({ error: error.message }, { status: error.status })
    : null;

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from("promotional_trial_codes")
      .select(trialColumns)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const trials = ((data ?? []) as PromotionalTrial[]).map((trial) => ({
      ...trial,
      redemptionUrl: getPromotionalTrialUrl(trial.code),
    }));
    const { data: conversionEvents, error: conversionEventsError } = await supabaseAdmin
      .from("promotional_trial_conversion_events")
      .select("id, promotional_trial_code_id, event_type, created_at")
      .order("created_at", { ascending: false });

    if (conversionEventsError && !isMissingPromotionalTrialConversionsTable(conversionEventsError)) {
      throw conversionEventsError;
    }

    return NextResponse.json({
      trials,
      conversionEvents: (conversionEvents ?? []) as PromotionalTrialConversionEvent[],
    });
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
      trial_days: 15,
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
    const trials = ((data ?? []) as PromotionalTrial[]).map((trial) => ({
      ...trial,
      redemptionUrl: getPromotionalTrialUrl(trial.code),
    }));
    return NextResponse.json({ trials }, { status: 201 });
  } catch (error) {
    const authorization = unauthorizedResponse(error);
    if (authorization) return authorization;
    console.error("Admin promotional trial creation failed", error);
    return NextResponse.json({ error: "Unable to generate trial QR codes. Confirm the promotional trial migration is applied." }, { status: 500 });
  }
}
