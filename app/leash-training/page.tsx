import SeoLandingPage from "@/components/SeoLandingPage";
import { getLandingPageMetadata, landingPages } from "@/lib/landingPages";

const config = landingPages["leash-training"];

export const metadata = getLandingPageMetadata(config);

export default function LeashTrainingPage() {
  return <SeoLandingPage config={config} />;
}
