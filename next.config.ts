import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is for the self-hosted Docker/EC2 build — Vercel's own build
  // pipeline expects its normal trace output and breaks (ENOENT on
  // next-server.js.nft.json) if this is set during a Vercel build.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
