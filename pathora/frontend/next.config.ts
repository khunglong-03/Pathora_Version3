import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
  port?: string;
};

const parseRemoteImagePatterns = (
  value: string | undefined,
): RemotePattern[] => {
  if (!value) return [];

  const seen = new Set<string>();
  const patterns: RemotePattern[] = [];

  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      try {
        const normalized = entry.includes("://")
          ? entry
          : `https://${entry.replace(/^\/\//, "")}`;
        const url = new URL(normalized);
        const protocol = url.protocol === "http:" ? "http" : "https";
        const hostname = url.hostname.toLowerCase();
        const port = url.port || undefined;
        const key = `${protocol}://${hostname}:${port ?? ""}`;

        if (!hostname || seen.has(key)) return;
        seen.add(key);
        patterns.push({
          protocol,
          hostname,
          pathname: "/**",
          ...(port ? { port } : {}),
        });
      } catch {
        // Ignore invalid hosts so one bad entry does not break build.
      }
    });

  return patterns;
};

const envRemotePatterns = parseRemoteImagePatterns(
  process.env.NEXT_PUBLIC_REMOTE_IMAGE_HOSTS,
);

const defaultRemotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "cdn3.ivivu.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
];

const allowUnoptimized = process.env.NEXT_PUBLIC_IMAGES_UNOPTIMIZED === "true";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy-Report-Only",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss: ${process.env.NEXT_PUBLIC_API_GATEWAY || "http://host.docker.internal:8080"};`,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    // Set NEXT_PUBLIC_IMAGES_UNOPTIMIZED=true to bypass image optimization.
    unoptimized: allowUnoptimized,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
        pathname: "/api/mcp/asset/**",
      },
      {
        protocol: "https",
        hostname: "cdn3.ivivu.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wowcher.vn",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tourdatviet.vn",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "statics.vinpearl.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "travelhalong.com.vn",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Legacy: old MinIO URLs still stored in DB from test data
      // Can be removed after test data is refreshed with Cloudinary URLs
      {
        protocol: "http",
        hostname: "34.143.220.132",
        port: "9001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "34.143.220.132",
        port: "9001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "play.min.io",
        port: "9443",
        pathname: "/**",
      },
      ...defaultRemotePatterns,
      ...envRemotePatterns,
    ],
  },
};

const analyze = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default analyze(nextConfig);
