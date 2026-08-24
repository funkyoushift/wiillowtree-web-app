import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: githubPages ? "/wiillowtree-web-app" : "",
  assetPrefix: githubPages ? "/wiillowtree-web-app" : "",
};

export default nextConfig;
