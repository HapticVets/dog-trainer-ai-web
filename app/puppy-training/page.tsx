import SeoLandingPage from "@/components/SeoLandingPage";
import { getLandingPageMetadata, landingPages } from "@/lib/landingPages";

const config = landingPages["puppy-training"];

export const metadata = getLandingPageMetadata(config);

export default function PuppyTrainingPage() {
  return <SeoLandingPage config={config} />;
}
