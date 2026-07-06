import SeoLandingPage from "@/components/SeoLandingPage";
import { getLandingPageMetadata, landingPages } from "@/lib/landingPages";

const config = landingPages["stop-barking"];

export const metadata = getLandingPageMetadata(config);

export default function StopBarkingPage() {
  return <SeoLandingPage config={config} />;
}
