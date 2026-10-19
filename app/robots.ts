import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/subcontractor/'], // Ozel panelleri Google'dan gizle
    },
    sitemap: 'https://www.nxerp.com.tr/sitemap.xml',
  }
}
