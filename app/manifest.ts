import type { MetadataRoute } from 'next';

// Installable web app: Android uses these PNG icons for the home screen and launcher
// (it ignores SVG icons). The SVG favicon is app/icon.svg, the iOS one app/apple-icon.png.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StoryScan',
    short_name: 'StoryScan',
    description: 'A beautiful web-based disk usage visualizer',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#2563eb',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
