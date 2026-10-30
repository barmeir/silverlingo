const isGithubPages = process.env.GITHUB_PAGES === "true";
const isStaticBuild =
  isGithubPages ||
  process.env.STATIC_EXPORT === "true" ||
  process.env.CF_PAGES === "1" ||
  process.env.WORKERS_CI === "1";

const basePath = isGithubPages ? "/silverlingo" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isStaticBuild ? { output: "export" } : {}),
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://ezlqnyrfkrfryxswbhgg.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "sb_publishable_D7HnPLLIIOoIYgc0CvxNWw_pH3vbhcQ",
  },
};

module.exports = nextConfig;
