import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import { LexiChat } from "@/components/lexi";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Skill-Link — Verified Doorstep Pros & 15-Min Roadside Assistance",
  description:
    "Skill-Link is a modern on-demand service marketplace. Book verified local plumbers, electricians, and technicians at your doorstep, or trigger 15-minute emergency roadside assistance.",
  keywords: [
    "plumber near me", "electrician near me", "mechanic near me",
    "emergency roadside assistance", "SOS mechanic", "tyre puncture help",
    "home services", "Skill-Link", "hyperlocal services India",
  ],
  authors: [{ name: "Skill-Link Team" }],
  creator: "Skill-Link",
  openGraph: {
    type:        "website",
    locale:      "en_IN",
    url:         "https://skilllink.ai",
    siteName:    "Skill-Link",
    title:       "Skill-Link — Verified Pros & Emergency Assistance",
    description: "Verified local pros & 15-min emergency roadside dispatch.",
    images: [{ url: "https://skilllink.ai/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Skill-Link — Verified Pros & Emergency Assistance",
    description: "Modern service marketplace with verified professionals.",
    images:      ["https://skilllink.ai/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#ffffff",
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-[#f8fafc] text-slate-900 min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
        <div className="relative z-10 w-full min-h-screen flex flex-col">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
            {children}
          </main>
          <Footer />

          {/* Lexi AI Floating Assistant */}
          <LexiChat />
        </div>
      </body>
    </html>
  );
}
