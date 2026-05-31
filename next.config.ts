import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — avoids Turbopack inferring a
  // stray lockfile in a parent directory (e.g. ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
  // Permite recursos de dev (HMR, assets) desde el túnel cloudflared usado
  // para el smoke test OAuth de MP. Sacar cuando se termine el smoke test.
  allowedDevOrigins: ["dubai-pearl-piano-fellow.trycloudflare.com"],
};

export default nextConfig;
