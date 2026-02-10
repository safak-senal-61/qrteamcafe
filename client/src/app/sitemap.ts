import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://qrders.com.tr'

  const routes = [
    '',
    '/about',
    '/contact',
    '/features',
    '/pricing',
    '/privacy',
    '/terms',
    '/distance-sales-agreement',
    '/return-policy',
    '/kvkk',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
