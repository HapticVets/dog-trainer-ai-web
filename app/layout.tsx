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
    default: "Patriot K9 AI Trainer | Personalized Dog Training Plans",
    template: `%s | ${siteConfig.brandName}`,
  },
  description:
    "Create personalized dog training sessions, track progress, and get ongoing AI coaching built around your dog's needs.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Patriot K9 AI Trainer | Personalized Dog Training Plans",
    description:
      "Create personalized dog training sessions, track progress, and get ongoing AI coaching built around your dog's needs.",
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
    title: "Patriot K9 AI Trainer | Personalized Dog Training Plans",
    description:
      "Create personalized dog training sessions, track progress, and get ongoing AI coaching built around your dog's needs.",
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
