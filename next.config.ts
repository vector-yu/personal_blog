import type { NextConfig } from 'next';
import { remotePatternsFromAllowlist } from './src/lib/image-hosts';

/**
 * Vercel exposes `VERCEL_PROJECT_PRODUCTION_URL` on the server only, but `src/lib/site-url.ts` is
 * also used by the client (via the root layout's `metadataBase`). Re-export it under a
 * NEXT_PUBLIC_ name so both sides resolve the same origin; without this the client falls back to
 * localhost and the server/client metadata disagree.
 */
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??=
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
}

/**
 * The site moved from unprefixed Chinese URLs to `/zh/...` + `/en/...`.
 * These 308s keep old inbound links and search results working. They run
 * before the filesystem, so they never shadow `/zh` or `/en`.
 */
const legacyChineseRoutes = [
  { source: '/posts/:path*', destination: '/zh/posts/:path*' },
  { source: '/tags/:path*', destination: '/zh/tags/:path*' },
  { source: '/series/:path*', destination: '/zh/series/:path*' },
  { source: '/archive', destination: '/zh/archive' },
  { source: '/projects', destination: '/zh/projects' },
  { source: '/notes', destination: '/zh/notes' },
  { source: '/reading', destination: '/zh/reading' },
  { source: '/resume', destination: '/zh/resume' },
  { source: '/about', destination: '/zh/about' },
  { source: '/start-here', destination: '/zh/start-here' },
  { source: '/now', destination: '/zh/now' },
  { source: '/uses', destination: '/zh/uses' },
  { source: '/rss.xml', destination: '/zh/rss.xml' },
];

const nextConfig: NextConfig = {
  // The root layout lives in `app/[lang]`, so a completely unmatched URL has no
  // layout to compose a 404 from; Next 16 handles that with a global 404 file.
  experimental: {
    globalNotFound: true,
  },
  images: {
    // Derived from ALLOWED_IMAGE_HOSTS (src/lib/image-hosts.ts) so the optimizer's rules and
    // the component's check cannot disagree — a mismatch produces broken images with no error.
    remotePatterns: remotePatternsFromAllowlist().map((pattern) => ({
      protocol: 'https' as const,
      hostname: pattern.hostname,
    })),
  },
  async redirects() {
    return [
      { source: '/', destination: '/zh', permanent: true },
      ...legacyChineseRoutes.map((route) => ({ ...route, permanent: true })),
    ];
  },
};

export default nextConfig;
