/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP Blog & Case Study Listing Page (Server Component)
 */

import type { Metadata } from "next"
import { getPublishedBlogPosts } from "@/app/actions/blog"
import BlogListClient from "./BlogListClient"

export const metadata: Metadata = {
  title: "Başarı Hikayeleri & Sektörel Blog | Nexa ERP",
  description:
    "Büyük ölçekli şantiyelerde finansal kaçakları önleyen, 5D BIM entegrasyonuyla metraj sapmalarını sıfırlayan ve BLE IoT ile iş kazalarını engelleyen gerçek saha başarı hikayeleri.",
  keywords: [
    "Nexa ERP Blog",
    "İnşaat ERP Başarı Hikayeleri",
    "5D BIM Vaka Analizi",
    "Otonom Hakediş Yönetimi",
    "Şantiye Dijitalleşme",
    "İnşaat CFO Çözümleri",
    "BLE IoT İSG Şantiye",
  ],
  alternates: {
    canonical: "https://www.nxerp.com.tr/blog",
  },
  openGraph: {
    title: "Başarı Hikayeleri & Sektörel Blog | Nexa ERP",
    description:
      "Büyük ölçekli şantiyelerde finansal kaçakları önleyen, 5D BIM entegrasyonuyla metraj sapmalarını sıfırlayan ve BLE IoT ile iş kazalarını engelleyen gerçek saha başarı hikayeleri.",
    url: "https://www.nxerp.com.tr/blog",
    siteName: "Nexa ERP",
    type: "website",
    locale: "tr_TR",
  },
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()

  // Blog / CollectionPage JSON-LD schema for GEO & SEO
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Nexa ERP Başarı Hikayeleri & Blog",
    "description":
      "Büyük ölçekli şantiyelerde finansal kaçakları önleyen, 5D BIM entegrasyonuyla metraj sapmalarını sıfırlayan ve BLE IoT ile iş kazalarını engelleyen gerçek saha analizleri.",
    "url": "https://www.nxerp.com.tr/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Nexa ERP",
      "url": "https://www.nxerp.com.tr",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.nxerp.com.tr/logo.png",
      },
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": posts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://www.nxerp.com.tr/blog/${post.slug}`,
        "name": post.title,
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <BlogListClient initialPosts={posts} />
    </>
  )
}
