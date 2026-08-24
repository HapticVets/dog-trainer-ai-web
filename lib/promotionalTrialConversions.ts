import { isMissingPromotionalTrialsTable } from "@/lib/promotionalTrials";
import { supabaseAdmin } from "@/lib/supabase-admin";

const missingRelationCodes = new Set(["42P01", "PGRST205"]);

export type PromotionalTrialConversionEventType =
  | "trial_upgrade_cta_clicked"
  | "trial_converted_to_premium";

export type PromotionalTrialConversionEvent = {
  id: string;
  promotional_trial_code_id: string;
  event_type: PromotionalTrialConversionEventType;
  created_at: string;
};

const isMissingConversionEventsTable = (error: { code?: string } | null) =>
  Boolean(error?.code && missingRelationCodes.has(error.code));

async function getRedeemedTrialForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("promotional_trial_codes")
    .select("id, expires_at")
    .eq("status", "redeemed")
    .eq("redeemed_by_clerk_user_id", userId)
    .is("revoked_at", null)
    .order("redeemed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isMissingPromotionalTrialsTable(error)) return null;
  if (error) throw new Error(error.message);
  return data;
}

export async function recordPromotionalTrialUpgradeCtaClick(userId: string) {
  const trial = await getRedeemedTrialForUser(userId);
  if (!trial) return false;

  const now = Date.now();
  const expiresAt = trial.expires_at ? new Date(trial.expires_at).getTime() : null;
  const metadata = {
    trial_state: expiresAt && expiresAt > now ? "active" : "expired",
    days_remaining: expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 86_400_000)) : null,
  };
  const { error } = await supabaseAdmin
    .from("promotional_trial_conversion_events")
    .insert({
      promotional_trial_code_id: trial.id,
      clerk_user_id: userId,
      event_type: "trial_upgrade_cta_clicked",
      metadata,
    });

  if (isMissingConversionEventsTable(error)) {
    throw new Error("Promotional trial conversion tracking migration is not applied.");
  }
  if (error) throw new Error(error.message);
  return true;
}

export async function recordPromotionalTrialPremiumConversion({
  userId,
  stripeSubscriptionId,
}: {
  userId: string;
  stripeSubscriptionId: string;
}) {
  const trial = await getRedeemedTrialForUser(userId);
  if (!trial) return false;

  const { error } = await supabaseAdmin
    .from("promotional_trial_conversion_events")
    .insert({
      promotional_trial_code_id: trial.id,
      clerk_user_id: userId,
      event_type: "trial_converted_to_premium",
      stripe_subscription_id: stripeSubscriptionId,
    });

  // Stripe can redeliver lifecycle events. The partial unique index makes a
  // paid conversion idempotent without obscuring real database errors.
  if (error?.code === "23505") return false;
  if (isMissingConversionEventsTable(error)) {
    throw new Error("Promotional trial conversion tracking migration is not applied.");
  }
  if (error) throw new Error(error.message);
  return true;
}

export const isMissingPromotionalTrialConversionsTable = isMissingConversionEventsTable;
