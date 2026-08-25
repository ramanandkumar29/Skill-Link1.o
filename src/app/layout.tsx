import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import LexiAssistant from "@/components/LexiAssistant";

export const metadata: Metadata = {
  title: "SkillLink - Service Marketplace",
  description: "Next-generation service marketplace connecting clients with verified local technicians.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className="antialiased bg-[#090d16] text-slate-100 min-h-screen overflow-x-hidden flex flex-col justify-between">
        <div className="w-full min-h-screen relative flex flex-col justify-between overflow-x-hidden">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 overflow-x-hidden">
            {children}
          </main>
          <Footer />
          {/* Global Skill-Link AI Assistant */}
          <LexiAssistant />
        </div>
      </body>
    </html>
  );
}
