import PromotionalTrialRedeem from "@/components/PromotionalTrialRedeem";
import { normalizePromotionalTrialCode } from "@/lib/promotionalTrials";

export default async function RedeemPromotionalTrialPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <PromotionalTrialRedeem code={normalizePromotionalTrialCode(code)} />;
}
