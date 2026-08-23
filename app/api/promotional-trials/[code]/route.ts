import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  hasRedeemedPromotionalTrial,
  normalizePromotionalTrialCode,
  normalizePromotionalTrialEmail,
} from "@/lib/promotionalTrials";
import { supabaseAdmin } from "@/lib/supabase-admin";

type TrialStatus = {
  state: "invalid" | "available" | "revoked" | "claimed";
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
    .select("status, redeemed_by_clerk_user_id, expires_at, revoked_at")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { state: "invalid" as const };
  if (data.revoked_at || data.status === "revoked") return { state: "revoked" as const };
  if (data.status !== "available" || data.redeemed_by_clerk_user_id) {
    return { state: "claimed" as const, redeemedBy: data.redeemed_by_clerk_user_id, expiresAt: data.expires_at };
  }
  return { state: "available" as const };
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

    if (!userId) return NextResponse.json({ authenticated: false, ...status });
    if (status.state === "claimed" && status.redeemedBy === userId) {
      return NextResponse.json({ authenticated: true, state: "active", expiresAt: status.expiresAt });
    }
    if (status.state !== "available") return NextResponse.json({ authenticated: true, state: status.state });

    const account = await getAccountAccessState(userId);
    if (account.hasEquivalentAccess) {
      return NextResponse.json({ authenticated: true, state: "already_has_access" });
    }
    if (await hasRedeemedPromotionalTrial(userId)) {
      return NextResponse.json({ authenticated: true, state: "account_used" });
    }
    return NextResponse.json({ authenticated: true, state: "available" });
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

    const result = (data?.[0] ?? null) as { result?: string; trial_expires_at?: string | null } | null;
    if (result?.result !== "redeemed" || !result.trial_expires_at) {
      const messages: Record<string, string> = {
        not_found: "This complimentary trial is not available.",
        revoked: "This complimentary trial is no longer available.",
        claimed: "This complimentary trial has already been claimed.",
        account_used: "This account has already used a complimentary Patriot K9 trial.",
      };
      const state = result?.result && result.result !== "redeemed" ? result.result : "not_found";
      return NextResponse.json({ error: messages[state] ?? "This complimentary trial is not available.", state }, { status: 409 });
    }

    return NextResponse.json({ success: true, expiresAt: result.trial_expires_at });
  } catch (error) {
    console.error("Promotional trial redemption crashed", error);
    return NextResponse.json({ error: "Unable to activate this complimentary trial right now." }, { status: 500 });
  }
}
