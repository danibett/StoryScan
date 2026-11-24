/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app uses no next/image: with the optimizer off /_next/image does not exist at all,
  // so its past and future vulnerabilities (e.g. CVE-2024-47831) do not apply here.
  images: { unoptimized: true },
  // Native module: loaded by Node at runtime, never bundled (was experimental.* before Next 15)
  serverExternalPackages: ['better-sqlite3'],
  // No CORS headers: the UI and the API share one origin. "Access-Control-Allow-Origin: *"
  // let any website opened on the LAN read the whole scanned file tree from /api/scan.
};

module.exports = nextConfig;
