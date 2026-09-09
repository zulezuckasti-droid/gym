import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PinGate } from "@/components/pin/pin-gate";
import { SerwistProvider } from "@/components/pwa/serwist-provider";
import { WorkoutBootstrap } from "@/components/workout/workout-bootstrap";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym",
  description: "Personal workout tracker",
  applicationName: "Gym",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0b",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const authenticated = Boolean(data?.claims);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground"
        suppressHydrationWarning
      >
        <SerwistProvider swUrl="/serwist/sw.js">
          <WorkoutBootstrap />
          {authenticated ? <PinGate>{children}</PinGate> : children}
        </SerwistProvider>
      </body>
    </html>
  );
}
