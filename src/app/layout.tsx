import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CycleProvider } from "@/contexts/CycleContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Treniren - Training Diary",
  description: "Personal training diary for tracking workouts, climbing sessions, and performance patterns",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Treniren",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Treniren" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ServiceWorkerProvider />
        <LanguageProvider>
          <CycleProvider>
            {children}
            <PWAInstallPrompt />
            <OfflineIndicator />
          </CycleProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
