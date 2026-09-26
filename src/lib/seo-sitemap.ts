/** Shared helpers for the multi-file sitemap. Host comes from the request so it works on any domain. */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  return sandboxHost ? `https://${sandboxHost}` : url.origin;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type UrlEntry = {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
  lastmod?: string;
};

export function urlset(origin: string, entries: UrlEntry[]): Response {
  const seen = new Set<string>();
  const body = entries
    .filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)))
    .map((e) =>
      [
        "  <url>",
        `    <loc>${esc(origin + e.path)}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return xml(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`,
  );
}

export function sitemapIndex(origin: string, names: string[]): Response {
  const body = names
    .map((n) => `  <sitemap>\n    <loc>${esc(`${origin}/sitemaps/${n}`)}</loc>\n  </sitemap>`)
    .join("\n");
  return xml(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`,
  );
}

function xml(s: string): Response {
  return new Response(s, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
  });
}

export const SPORTS = ["football", "basketball", "tennis"] as const;

/** Every child sitemap listed in /sitemap.xml. */
export const SITEMAP_NAMES = [
  "pages.xml",
  "countries.xml",
  "games.xml",
  ...SPORTS.flatMap((s) => [`matches-${s}.xml`, `results-${s}.xml`, `leagues-${s}.xml`, `teams-${s}.xml`]),
];

export const STATIC_PAGES: UrlEntry[] = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/virtual", changefreq: "hourly", priority: "0.9" },
  { path: "/aviator", changefreq: "daily", priority: "0.9" },
  { path: "/royal-fortune", changefreq: "daily", priority: "0.9" },
  { path: "/slot", changefreq: "daily", priority: "0.9" },
  { path: "/results", changefreq: "hourly", priority: "0.8" },
  { path: "/payment-methods", changefreq: "weekly", priority: "0.8" },
  { path: "/lucky-winner", changefreq: "daily", priority: "0.7" },
  { path: "/countries", changefreq: "weekly", priority: "0.6" },
  { path: "/standings", changefreq: "daily", priority: "0.7" },
  { path: "/teams", changefreq: "weekly", priority: "0.6" },
  { path: "/players", changefreq: "weekly", priority: "0.6" },
  { path: "/topscorers", changefreq: "daily", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/partnership", changefreq: "monthly", priority: "0.5" },
  { path: "/responsible-gaming", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];
