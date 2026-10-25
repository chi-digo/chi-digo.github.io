import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@chi-digo/design-system"],
  turbopack: {},
  // Swahili and Digo article pages render on first request and read their article from
  // content/articles (spec 34 §17.10): ship those files with the server functions.
  outputFileTracingIncludes: {
    "/[locale]/**": ["./content/articles/**/*.json"],
  },
};

export default withSentryConfig(withSerwist(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  release: {
    name: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  },
});
