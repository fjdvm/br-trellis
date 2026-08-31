import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brenraphaelubejam.com";

  const routes = [
    "",
    "/products",
    "/careers",
    "/contact",
    "/faq",
    "/about",
    "/terms",
    "/privacy",
    "/returns",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
