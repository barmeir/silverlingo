const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/silverlingo" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isGithubPages ? { output: "export" } : {}),
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;
