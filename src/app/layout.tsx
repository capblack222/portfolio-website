import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Silkscreen } from "next/font/google";
import { PixelCursorTrail } from "@/components/effects/pixel-cursor-trail";
import { TerminalBoot } from "@/components/effects/terminal-boot";
import { profile } from "@/data/profile";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: `${profile.headline}. ${profile.subline}`,
  openGraph: {
    title: `${profile.name} — ${profile.role}`,
    description: profile.headline,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${jetbrains.variable} ${silkscreen.variable}`}
    >
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-void"
        >
          Skip to content
        </a>

        <PixelCursorTrail />
        <TerminalBoot />

        {children}
      </body>
    </html>
  );
}
