import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patriot K9 Command",
  description:
    "Structured dog training system. Fix behavior, build obedience, and train with discipline.",
  openGraph: {
    title: "Patriot K9 Command",
    description:
      "Structured dog training system built for real results.",
    url: "https://train.hapticvets.com",
    siteName: "Patriot K9 Command",
    images: [
      {
        url: "https://train.hapticvets.com/patriot-k9-embed.jpg",
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
      "Structured dog training system built for real results.",
    images: ["https://train.hapticvets.com/patriot-k9-embed.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}