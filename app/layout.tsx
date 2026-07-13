import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import GlobalFooter from "@/components/GlobalFooter";
import GlobalNavbar from "@/components/GlobalNavbar";
import GoogleAdsTag from "@/components/GoogleAdsTag";
import { authRoutes, siteConfig } from "@/lib/site";

const defaultMetadataTitle = "Patriot K9 AI Trainer | Personalized Dog Training Plans";
const defaultMetadataDescription =
  "Create personalized dog training sessions, track progress, and get ongoing AI coaching built around your dog's needs.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.appUrl),
  title: {
    default: defaultMetadataTitle,
    template: `%s | ${siteConfig.brandName}`,
  },
  description: defaultMetadataDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: defaultMetadataTitle,
    description: defaultMetadataDescription,
    url: siteConfig.appUrl,
    siteName: siteConfig.siteName,
    images: [
      {
        url: siteConfig.socialShareImagePath,
        width: 1200,
        height: 630,
        alt: "Patriot K9 Command AI Dog Trainer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultMetadataTitle,
    description: defaultMetadataDescription,
    images: [
      {
        url: siteConfig.socialShareImagePath,
        alt: "Patriot K9 Command AI Dog Trainer",
      },
    ],
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
