import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  hasRedeemedPromotionalTrial,
  maskPromotionalTrialEmail,
  normalizePromotionalTrialCode,
  normalizePromotionalTrialEmail,
  getPuppyTrialLabels,
} from "@/lib/promotionalTrials";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RedemptionResult = "redeemed" | "not_found" | "revoked" | "claimed" | "account_used" | "buyer_email_mismatch";
type TrialStatus = {
  state: "invalid" | "available" | "revoked" | "claimed";
  trialType?: "general" | "puppy_buyer";
  buyerEmail?: string | null;
  buyerEmailMasked?: string | null;
  puppyLabel?: string | null;
  redeemedBy?: string | null;
  expiresAt?: string | null;
};

const getAccountAccessState = async (userId: string) => {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const verifiedEmails = user.emailAddresses
    .filter((email) => email.verification?.status === "verified")
    .map((email) => normalizePromotionalTrialEmail(email.emailAddress))
    .filter(Boolean);
  return {
    email: verifiedEmails[0] ?? normalizePromotionalTrialEmail(user.primaryEmailAddress?.emailAddress ?? ""),
    verifiedEmails,
    hasEquivalentAccess:
      user.publicMetadata?.role === "admin" ||
      user.publicMetadata?.premium === true ||
      user.publicMetadata?.clientAccess === true,
  };
};

const getTrialStatus = async (code: string): Promise<TrialStatus> => {
  const { data, error } = await supabaseAdmin
    .from("promotional_trial_codes")
    .select("status, trial_type, buyer_email, puppy_id, redeemed_by_clerk_user_id, expires_at, revoked_at")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { state: "invalid" as const };
  const puppyLabels = data.puppy_id ? await getPuppyTrialLabels([data.puppy_id]) : new Map<string, string>();
  const details = {
    trialType: data.trial_type as "general" | "puppy_buyer",
    buyerEmailMasked: data.trial_type === "puppy_buyer" && data.buyer_email ? maskPromotionalTrialEmail(data.buyer_email) : null,
    puppyLabel: data.puppy_id ? puppyLabels.get(data.puppy_id) ?? null : null,
  };
  if (data.revoked_at || data.status === "revoked") return { state: "revoked" as const, ...details };
  if (data.status !== "available" || data.redeemed_by_clerk_user_id) {
    return { state: "claimed" as const, redeemedBy: data.redeemed_by_clerk_user_id, expiresAt: data.expires_at, ...details };
  }
  return { state: "available" as const, ...details, buyerEmail: data.buyer_email };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code: rawCode } = await params;
    const code = normalizePromotionalTrialCode(rawCode);
    const status = await getTrialStatus(code);
    const { userId } = await auth();

    if (!userId) {
      const safeStatus = { ...status };
      delete safeStatus.buyerEmail;
      return NextResponse.json({ authenticated: false, ...safeStatus });
    }
    if (status.state === "claimed" && status.redeemedBy === userId) {
      return NextResponse.json({ authenticated: true, state: "active", expiresAt: status.expiresAt, trialType: status.trialType, puppyLabel: status.puppyLabel });
    }
    if (status.state !== "available") return NextResponse.json({ authenticated: true, state: status.state, trialType: status.trialType, puppyLabel: status.puppyLabel });

    const account = await getAccountAccessState(userId);
    if (account.hasEquivalentAccess) {
      return NextResponse.json({ authenticated: true, state: "already_has_access", trialType: status.trialType, puppyLabel: status.puppyLabel });
    }
    if (await hasRedeemedPromotionalTrial(userId)) {
      return NextResponse.json({ authenticated: true, state: "account_used", trialType: status.trialType, puppyLabel: status.puppyLabel });
    }
    if (status.trialType === "puppy_buyer" && (!status.buyerEmail || !account.verifiedEmails.includes(normalizePromotionalTrialEmail(status.buyerEmail)))) {
      return NextResponse.json({ authenticated: true, state: "buyer_email_mismatch", trialType: status.trialType, puppyLabel: status.puppyLabel, buyerEmailMasked: status.buyerEmailMasked });
    }
    return NextResponse.json({ authenticated: true, state: "available", trialType: status.trialType, puppyLabel: status.puppyLabel });
  } catch (error) {
    console.error("Promotional trial availability check failed", error);
    return NextResponse.json({ error: "Unable to check this complimentary trial right now." }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in to activate this complimentary trial." }, { status: 401 });

    const account = await getAccountAccessState(userId);
    if (account.hasEquivalentAccess) {
      return NextResponse.json({ error: "Your account already has Premium training access.", state: "already_has_access" }, { status: 409 });
    }

    const { code: rawCode } = await params;
    const code = normalizePromotionalTrialCode(rawCode);
    const { data, error } = await supabaseAdmin.rpc("redeem_promotional_trial_code", {
      p_code: code,
      p_clerk_user_id: userId,
      p_redeemed_by_email: account.email,
      p_verified_emails: account.verifiedEmails,
    });

    if (error) {
      console.error("Promotional trial redemption failed", error);
      return NextResponse.json({ error: "Unable to activate this complimentary trial right now." }, { status: 500 });
    }

    const result = (data?.[0] ?? null) as { result?: RedemptionResult; trial_expires_at?: string | null } | null;
    if (result?.result !== "redeemed" || !result.trial_expires_at) {
      const messages: Record<Exclude<RedemptionResult, "redeemed">, string> = {
        not_found: "This complimentary trial is not available.",
        revoked: "This complimentary trial is no longer available.",
        claimed: "This complimentary trial has already been claimed.",
        account_used: "This account has already used a complimentary Patriot K9 trial.",
        buyer_email_mismatch: "This complimentary puppy trial was issued to a different email address.",
      };
      const state = result?.result && result.result !== "redeemed" ? result.result : "not_found";
      return NextResponse.json({ error: messages[state], state }, { status: 409 });
    }

    return NextResponse.json({ success: true, expiresAt: result.trial_expires_at });
  } catch (error) {
    console.error("Promotional trial redemption crashed", error);
    return NextResponse.json({ error: "Unable to activate this complimentary trial right now." }, { status: 500 });
  }
}
