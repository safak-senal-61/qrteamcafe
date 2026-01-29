import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://qrders.com.tr'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/super/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
