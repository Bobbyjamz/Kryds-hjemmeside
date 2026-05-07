import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://krydsbyg.com";
  const now = new Date();

  const ydelser = [
    "rengøring",
    "flytning",
    "maling",
    "montering",
    "have",
    "håndværk",
    "byggeplads",
    "events",
    "kombineret",
  ];

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/ydelser`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Per-ydelse sider (høj SEO-værdi — folk søger på "maler til leje" etc.)
    ...ydelser.map((slug) => ({
      url: `${base}/ydelser/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    {
      url: `${base}/priser`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/om-os`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/handelsbetingelser`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/privatpolitik`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/tilmeld`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
