import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/reset-password', '/forgot-password', '/checkout', '/subscription'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/reset-password', '/forgot-password', '/checkout', '/subscription'],
      },
    ],
    sitemap: 'https://collegeorbit.app/sitemap.xml',
    host: 'https://collegeorbit.app',
  };
}
