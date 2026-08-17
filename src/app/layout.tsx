import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Silkscreen } from "next/font/google";
import { PixelCursorTrail } from "@/components/effects/pixel-cursor-trail";
import { TerminalBoot } from "@/components/effects/terminal-boot";
import { SiteNav } from "@/components/ui/site-nav";
import { TrailToggle } from "@/components/ui/trail-toggle";
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
      // The pre-paint script below adds .boot-skip to <html> before React
      // hydrates, so the server and client className necessarily differ. That
      // is the entire point of running it early — waiting for React would mean
      // a flash of page content before the overlay.
      //
      // This only suppresses the warning for this element's own attributes.
      // Everything inside the tree is still checked normally.
      suppressHydrationWarning
    >
      <head>
        {/*
          Runs before first paint. Decides whether the boot overlay plays at
          all, so the overlay is either covering the screen from frame one or
          never rendered — never a flash of page followed by an overlay.
          Wrapped in try/catch because sessionStorage throws in some privacy
          modes, and a failed check should skip the sequence, not the page.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=sessionStorage.getItem("boot-played")==="1",r=matchMedia("(prefers-reduced-motion: reduce)").matches,n=matchMedia("(max-width: 639px)").matches;if(s||r||n){document.documentElement.classList.add("boot-skip")}else{sessionStorage.setItem("boot-played","1")}}catch(e){document.documentElement.classList.add("boot-skip")}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-void"
        >
          Skip to content
        </a>

        {/* z-order: canvas 0, page content 10, nav and toggle 40, boot 50 */}
        <PixelCursorTrail />
        <SiteNav />
        <TrailToggle />
        <TerminalBoot />

        {children}
      </body>
    </html>
  );
}
