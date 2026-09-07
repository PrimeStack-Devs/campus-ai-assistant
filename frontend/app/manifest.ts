import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dexa AI - Campus Assistant',
    short_name: 'Dexa AI',
    description: 'Smart campus assistant for Parul University navigation, queries, and events',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#4f46e5',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
