import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

// Theme follows the OS preference (as before the redesign); tokens switch on data-theme.
// Runs before paint so there's no flash of the wrong theme.
const themeScript = `(function(){try{var m=window.matchMedia('(prefers-color-scheme: light)');var a=function(){document.documentElement.setAttribute('data-theme',m.matches?'light':'dark')};a();m.addEventListener('change',a)}catch(e){}})()`;

export const metadata: Metadata = {
  title: "Unicorn Climb - Train with your unicorn flow",
  description: "Personal training diary for tracking workouts, climbing sessions, and performance patterns",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [
      { url: "/icon-192.svg", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Unicorn Climb",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Same values as --uc-bg (metadata can't read CSS variables)
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121016" },
    { media: "(prefers-color-scheme: light)", color: "#F7F4F8" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Unicorn Climb" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
