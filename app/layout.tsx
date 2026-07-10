import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import GlobalFooter from "@/components/GlobalFooter";
import GlobalNavbar from "@/components/GlobalNavbar";
import GoogleAdsTag from "@/components/GoogleAdsTag";
import { authRoutes, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.appUrl),
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.brandName}`,
  },
  description:
    "Structured dog training platform built for real-world results. Log sessions, track progress, and generate precise training plans using the 4C K9 Doctrine.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.siteName,
    description:
      "Structured dog training platform built for real-world results.",
    url: siteConfig.appUrl,
    siteName: siteConfig.siteName,
    images: [
      {
        url: "/patriot-k9-embed.jpg",
        width: 1200,
        height: 630,
        alt: siteConfig.siteName,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.siteName,
    description:
      "Structured dog training platform built for real-world results.",
    images: ["/patriot-k9-embed.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl={authRoutes.signInUrl}
      signUpUrl={authRoutes.signUpUrl}
    >
      <html lang="en">
        <body className="bg-[#0b0f17] text-white antialiased">
          <GoogleAdsTag />
          <GlobalNavbar />
          {children}
          <GlobalFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
