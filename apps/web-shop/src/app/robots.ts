import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brenraphaelubejam.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile/", "/checkout/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
