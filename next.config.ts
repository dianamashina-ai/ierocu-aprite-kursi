import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Līdz palaišanai: aizliegums meklētājiem arī HTTP galvenē (SITE_INDEXING=1 to noņem)
  async headers() {
    if (process.env.SITE_INDEXING === "1") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default withNextIntl(nextConfig);
