import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns = supabaseUrl
  ? [
      {
        protocol: new URL(supabaseUrl).protocol.replace(":", "") as "http" | "https",
        hostname: new URL(supabaseUrl).hostname,
        pathname: "/storage/v1/object/sign/**",
      },
    ]
  : [];

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
