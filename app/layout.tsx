import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import GlobalNavbar from "@/components/GlobalNavbar";

export const metadata: Metadata = {
  title: {
    default: "Patriot K9 Command",
    template: "%s | Patriot K9 Command",
  },
  description:
    "Structured dog training platform built for real-world results. Log sessions, track progress, and generate precise training plans using the 4C K9 Doctrine.",

  openGraph: {
    title: "Patriot K9 Command",
    description:
      "Structured dog training platform built for real-world results.",
    url: "https://train.hapticvets.com",
    siteName: "Patriot K9 Command",
    images: [
      {
        url: "/og-image1-v2.jpg", // this must exist in /public
        width: 1200,
        height: 630,
        alt: "Patriot K9 Command",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Patriot K9 Command",
    description:
      "Structured dog training platform built for real-world results.",
    images: ["/og-image1-v2.jpg"],
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
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#0b0f17] text-white antialiased">
          <GlobalNavbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}