/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import OfflineStatus from "@/components/OfflineStatus";
import OfflineSyncManager from "@/components/OfflineSyncManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import AILegislationAssistant from "@/components/AILegislationAssistant";
import JsonLd from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nxerp.com.tr"),
  title: {
    default: "Nexa ERP | Yeni Nesil İnşaat & Şantiye Yönetim Yazılımı",
    template: "%s | Nexa ERP",
  },
  description: "3D BIM, IoT İSG takibi, otomatik hakediş blokesi ve Offline-First PWA altyapısıyla inşaat projelerinizi tek merkezden yönetin. Kurumsal SaaS çözümü.",
  keywords: [
    "İnşaat ERP",
    "Şantiye Yönetim Yazılımı",
    "5D BIM Yazılımı",
    "İSG Takip Sistemi",
    "Taşeron Hakediş Programı",
    "Offline Şantiye Uygulaması",
    "İnşaat Dijital İkiz",
    "Şantiye IoT",
    "Nexa ERP"
  ],
  authors: [{ name: "Nexa Technologies" }],
  creator: "Nexa",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexa ERP",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://www.nxerp.com.tr",
    title: "Nexa ERP | Şantiyenizin 4D Dijital İkizi",
    description: "İnşaat sektöründe devrim. 3D BIM, BLE Akıllı Baret takibi ve otomatik hakediş motoru ile projelerinizi güvenceye alın.",
    siteName: "Nexa ERP",
    images: [
      {
        url: "/icon-512.png",
        width: 1200,
        height: 630,
        alt: "Nexa ERP Şantiye Yönetim Platformu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexa ERP | İnşaat & Şantiye Yönetim Yazılımı",
    description: "3D BIM ve IoT destekli yeni nesil şantiye yönetimi.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.nxerp.com.tr",
    languages: {
      "tr": "https://www.nxerp.com.tr",
      "en": "https://www.nxerp.com.tr/en",
      "x-default": "https://www.nxerp.com.tr",
    },
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "theme-color": "#0f172a",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Google International SEO / Multilingual GEO Hreflang Tags */}
        <link rel="alternate" hrefLang="tr" href="https://www.nxerp.com.tr" />
        <link rel="alternate" hrefLang="en" href="https://www.nxerp.com.tr/en" />
        <link rel="alternate" hrefLang="x-default" href="https://www.nxerp.com.tr" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" suppressHydrationWarning>
        <JsonLd />
        <ThemeProvider>
          <OfflineStatus />
          <OfflineSyncManager />
          <AILegislationAssistant />
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
