/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app uses no next/image: turning the optimizer off removes /_next/image and the
  // DoS fixed upstream in 14.2.7 (CVE-2024-47831) until Next.js itself is updated.
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // No CORS headers: the UI and the API share one origin. "Access-Control-Allow-Origin: *"
  // let any website opened on the LAN read the whole scanned file tree from /api/scan.
};

module.exports = nextConfig;
