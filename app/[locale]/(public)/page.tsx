/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import type { Metadata } from "next"
import LandingPageClient from "./LandingPageClient"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Nexa ERP | Yeni Nesil İnşaat ERP, Şantiye Takip ve 4D BIM Yazılımı",
  description: "Nexa ERP; inşaat takip uygulaması, şantiye takip programı, inşaat erp ve otonom şantiye işletim sistemleri sunan yeni nesil B2B SaaS platformudur.",
  keywords: [
    "inşaat yazılımı",
    "inşaat erp",
    "şantiye erp",
    "şantiye takip uygulaması",
    "inşaat takip uygulaması",
    "4d bim erp",
    "nexa erp",
    "nexa inşaat yazılımı",
    "şantiye takip programı",
    "5D BIM",
    "4D Drone Dijital İkizi",
    "Offline-First",
    "Şantiye İSG",
    "Hakediş Blokesi",
    "Drone 4D",
    "Web-IFC",
    "İnşaat Yönetim Yazılımı",
    "B2B SaaS"
  ],
  openGraph: {
    title: "Nexa ERP | Yeni Nesil İnşaat ERP, Şantiye Takip ve 4D BIM Yazılımı",
    description: "Nexa ERP; inşaat takip uygulaması, şantiye takip programı, inşaat erp ve otonom şantiye işletim sistemleri sunan yeni nesil B2B SaaS platformudur.",
    type: "website",
    locale: "tr_TR",
    url: "https://www.nxerp.com.tr",
    siteName: "Nexa ERP",
    images: [
      {
        url: "/icon-512.png",
        width: 1200,
        height: 630,
        alt: "Nexa ERP | Yeni Nesil İnşaat ERP, Şantiye Takip ve 4D BIM Yazılımı",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexa ERP | Yeni Nesil İnşaat ERP, Şantiye Takip ve 4D BIM Yazılımı",
    description: "Nexa ERP; inşaat takip uygulaması, şantiye takip programı, inşaat erp ve otonom şantiye işletim sistemleri sunan yeni nesil B2B SaaS platformudur.",
    images: ["/icon-512.png"],
  },
}

export default function Home() {
  const landingJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.nxerp.com.tr/#software",
        "name": "Nexa ERP / Nexa Yazılım",
        "applicationCategory": "BusinessApplication, ConstructionManagementSoftware",
        "operatingSystem": "Web, iOS, Android, Windows, macOS",
        "url": "https://www.nxerp.com.tr",
        "description": "Nexa ERP; inşaat takip uygulaması, şantiye takip programı, inşaat erp ve otonom şantiye işletim sistemleri sunan yeni nesil B2B SaaS platformudur.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "TRY",
          "description": "B2B SaaS - Kurumsal Demo ve Teklif Usulü"
        }
      },
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": "https://www.nxerp.com.tr/#localbusiness",
        "name": "Nexa ERP / Nexa Yazılım",
        "legalName": "Nexa Yazılım Teknolojileri A.Ş.",
        "url": "https://www.nxerp.com.tr",
        "logo": "https://www.nxerp.com.tr/logo.png",
        "telephone": "+90 505 147 77 29",
        "email": "nxglobalinfo@gmail.com",
        "description": "İskenderun, Hatay merkezli ulusal/uluslararası SaaS. İnşaat ERP, şantiye takip ve 4D BIM yazılımı.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "İskenderun Teknik Üniversitesi (İSTE) Kampüsü, Teknopark Binası",
          "addressLocality": "İskenderun",
          "addressRegion": "Hatay",
          "postalCode": "31200",
          "addressCountry": "TR"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 36.5794,
          "longitude": 36.1751
        },
        "areaServed": {
          "@type": "Country",
          "name": "Türkiye",
          "description": "İskenderun, Hatay merkezli ulusal/uluslararası SaaS"
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd) }}
      />
      <LandingPageClient />
    </>
  )
}