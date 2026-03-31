import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import GlobalNavbar from "@/components/GlobalNavbar";

export const metadata: Metadata = {
  title: "Patriot K9 Command",
  description: "Professional dog training platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#0b0f17] text-white">
          <GlobalNavbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}