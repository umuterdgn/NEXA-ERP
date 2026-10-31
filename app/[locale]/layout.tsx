/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "react-hot-toast";
import OfflineStatus from "@/components/OfflineStatus";
import OfflineSyncManager from "@/components/OfflineSyncManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import AILegislationAssistant from "@/components/AILegislationAssistant";
import JsonLd from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nxerp.com.tr"),
  title: {
    default: "Nexa ERP | Yeni Nesil İnşaat & Franchise İşletim Sistemi",
    template: "%s | Nexa ERP",
  },
  description: "Nexa Global tarafından geliştirilen gelişmiş inşaat, franchise ve operasyon yönetim sistemi.",
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
      { url: "/icon.png" },
      new URL("/icon.png", "https://nxerp.com.tr"),
    ],
    shortcut: ["/shortcut-icon.png"],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon-precomposed.png",
      },
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
      "tr": "https://www.nxerp.com.tr/tr",
      "en": "https://www.nxerp.com.tr/en",
      "de": "https://www.nxerp.com.tr/de",
      "ru": "https://www.nxerp.com.tr/ru",
      "ar": "https://www.nxerp.com.tr/ar",
      "x-default": "https://www.nxerp.com.tr/tr",
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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  // RTL (Right-to-Left) Mimari Desteği:
  // Arapça (ar) için HTML direction niteliği 'rtl', diğer diller için 'ltr' olarak ayarlanır.
  // Tailwind CSS ile arayüz geliştirirken fiziksel yönler (ml-*, mr-*, pl-*, pr-*) yerine
  // mantıksal yönlendirmeler (ms-*, me-*, ps-*, pe-*, start-*, end-*) kullanılması önerilir.
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction} className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link rel="alternate" hrefLang="tr" href="https://www.nxerp.com.tr/tr" />
        <link rel="alternate" hrefLang="en" href="https://www.nxerp.com.tr/en" />
        <link rel="alternate" hrefLang="de" href="https://www.nxerp.com.tr/de" />
        <link rel="alternate" hrefLang="ru" href="https://www.nxerp.com.tr/ru" />
        <link rel="alternate" hrefLang="ar" href="https://www.nxerp.com.tr/ar" />
        <link rel="alternate" hrefLang="x-default" href="https://www.nxerp.com.tr/tr" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
