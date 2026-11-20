import type { MetadataRoute } from "next";
import { indexingAllowed } from "@/lib/site/indexing";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/konts", "/labojumi", "/rekins/", "/maksajums/"] } };
}
