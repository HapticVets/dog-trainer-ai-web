import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { absoluteUrl } from "@/lib/site";

export type PromotionalTrialStatus = "available" | "redeemed" | "revoked";
export type PromotionalTrialType = "general" | "puppy_buyer";

export type PromotionalTrial = {
  id: string;
  code: string;
  trial_days: number;
  trial_type: PromotionalTrialType;
  status: PromotionalTrialStatus;
  campaign_name: string | null;
  organization_name: string | null;
  notes: string | null;
  buyer_email: string | null;
  puppy_id: string | null;
  litter_id: string | null;
  created_at: string;
  redeemed_by_email: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

export type ActivePromotionalTrial = {
  expiresAt: string;
  daysRemaining: number;
};

const missingRelationCodes = new Set(["42P01", "PGRST205"]);

export const normalizePromotionalTrialCode = (value: string) =>
  value.trim().toUpperCase();

export const normalizePromotionalTrialEmail = (value: string) =>
  value.trim().toLowerCase();

export const createPromotionalTrialCode = () =>
  `PK9-${randomBytes(12).toString("hex").toUpperCase()}`;

export const getPromotionalTrialUrl = (code: string) =>
  absoluteUrl(`/redeem/${encodeURIComponent(normalizePromotionalTrialCode(code))}`);

export const isMissingPromotionalTrialsTable = (error: { code?: string } | null) =>
  Boolean(error?.code && missingRelationCodes.has(error.code));

export const maskPromotionalTrialEmail = (value: string) => {
  const [localPart, domain] = normalizePromotionalTrialEmail(value).split("@");
  if (!localPart || !domain) return "";
  return `${localPart.slice(0, 1)}***@${domain}`;
};

export async function getPuppyTrialLabels(puppyIds: string[]) {
  const uniqueIds = [...new Set(puppyIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, string>();

  const { data, error } = await supabaseAdmin
    .from("admin_litter_puppies")
    .select("id, collar_color, public_name, puppy_code")
    .in("id", uniqueIds);

  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((puppy) => [
    puppy.id,
    puppy.public_name?.trim() || (puppy.collar_color?.trim() ? `${puppy.collar_color.trim()} Collar Puppy` : puppy.puppy_code),
  ]));
}

export async function getActivePromotionalTrial(
  userId: string,
): Promise<ActivePromotionalTrial | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("promotional_trial_codes")
    .select("expires_at")
    .eq("status", "redeemed")
    .eq("redeemed_by_clerk_user_id", userId)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // The migration is manually applied in this project. Preserve all existing
  // access paths while an environment has not yet received the new table.
  if (isMissingPromotionalTrialsTable(error)) return null;
  if (error) throw new Error(error.message);
  if (!data?.expires_at) return null;

  const millisecondsRemaining = new Date(data.expires_at).getTime() - Date.now();
  return {
    expiresAt: data.expires_at,
    daysRemaining: Math.max(0, Math.ceil(millisecondsRemaining / 86_400_000)),
  };
}

export async function hasRedeemedPromotionalTrial(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("promotional_trial_codes")
    .select("id")
    .eq("redeemed_by_clerk_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (isMissingPromotionalTrialsTable(error)) return false;
  if (error) throw new Error(error.message);
  return Boolean(data);
}
