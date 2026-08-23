import { redirect } from "next/navigation";
import Link from "next/link";
import PromotionalTrialPrintSheet, { type PrintableTrial } from "@/components/PromotionalTrialPrintSheet";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import { getPromotionalTrialUrl } from "@/lib/promotionalTrials";
import { supabaseAdmin } from "@/lib/supabase-admin";

type PrintPageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

export default async function AdminPromotionalTrialPrintPage({ searchParams }: PrintPageProps) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === 401 ? "/sign-in" : "/dashboard");
    throw error;
  }

  const { id } = await searchParams;
  const requestedIds = [...new Set((Array.isArray(id) ? id : id ? [id] : []).filter(Boolean))].slice(0, 50);

  if (!requestedIds.length) {
    return <PrintEmptyState message="Select one or more available trial codes before opening a printable sheet." />;
  }

  const { data, error } = await supabaseAdmin
    .from("promotional_trial_codes")
    .select("id, code, trial_days, campaign_name, organization_name")
    .in("id", requestedIds)
    .eq("trial_type", "general")
    .eq("status", "available")
    .is("redeemed_by_clerk_user_id", null)
    .is("revoked_at", null);

  if (error) {
    console.error("Admin printable trial load failed", error);
    return <PrintEmptyState message="Unable to load the selected available trial codes." />;
  }

  const trials: PrintableTrial[] = (data ?? []).map((trial) => ({
    id: trial.id,
    code: trial.code,
    trialDays: trial.trial_days,
    campaignName: trial.campaign_name,
    organizationName: trial.organization_name,
    redemptionUrl: getPromotionalTrialUrl(trial.code),
  }));

  if (!trials.length) {
    return <PrintEmptyState message="None of the selected codes are currently available to print." />;
  }

  return <PromotionalTrialPrintSheet trials={trials} />;
}

function PrintEmptyState({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-amber-400/25 bg-neutral-950 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Printable Trial Cards</p>
        <h1 className="mt-2 text-2xl font-bold">No cards ready to print</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-300">{message}</p>
        <Link href="/admin/trials" className="mt-5 inline-flex rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300">Back to Trials</Link>
      </div>
    </main>
  );
}
