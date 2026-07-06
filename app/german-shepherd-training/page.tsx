import SeoLandingPage from "@/components/SeoLandingPage";
import { getLandingPageMetadata, landingPages } from "@/lib/landingPages";

const config = landingPages["german-shepherd-training"];

export const metadata = getLandingPageMetadata(config);

export default function GermanShepherdTrainingPage() {
  return <SeoLandingPage config={config} />;
}
