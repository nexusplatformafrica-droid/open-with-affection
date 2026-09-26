import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  requestOrigin,
  urlset,
  SITEMAP_NAMES,
  STATIC_PAGES,
  SPORTS,
  type UrlEntry,
} from "@/lib/seo-sitemap";
import { PAY_COUNTRIES } from "@/lib/payments";

type Sport = (typeof SPORTS)[number];

async function build(name: string): Promise<UrlEntry[]> {
  if (name === "pages.xml") return STATIC_PAGES;
  if (name === "countries.xml")
    return PAY_COUNTRIES.map((c) => ({
      path: `/betting/${c.code.toLowerCase()}`,
      changefreq: "weekly",
      priority: "0.8",
    }));
  if (name === "games.xml")
    return [
      { path: "/aviator", changefreq: "daily", priority: "0.9" },
      { path: "/royal-fortune", changefreq: "daily", priority: "0.9" },
      { path: "/slot", changefreq: "daily", priority: "0.9" },
      { path: "/virtual", changefreq: "hourly", priority: "0.9" },
    ];

  if (name === "winners.xml" || name === "images.xml") {
    const { fetchSiteContent } = await import("@/lib/site-content.server");
    const c = await fetchSiteContent();
    const winners = c.winners.filter((w) => w && w.active);
    const img = (u: string, title: string) => (u && /^(https?:)?\//.test(u) ? [{ loc: u, title }] : []);
    const winnerEntries: UrlEntry[] = winners.flatMap((w) => {
      const title = `${w.name} won UGX ${Math.round(w.amount).toLocaleString("en-US")} on BET PLUS+`;
      const lastmod = w.at ? new Date(w.at).toISOString().slice(0, 10) : undefined;
      return [
        { path: `/winner/${w.id}`, changefreq: "monthly" as const, priority: "0.7", lastmod, images: img(w.image, title) },
        { path: `/winner-ticket/${w.id}`, changefreq: "monthly" as const, priority: "0.7", lastmod, images: img(w.image, `Winning ticket — ${title}`) },
      ];
    });
    if (name === "winners.xml")
      return [{ path: "/lucky-winner", changefreq: "daily", priority: "0.8" }, ...winnerEntries];
    const live = (s: { active: boolean }) => s.active;
    return [
      {
        path: "/",
        images: [
          { loc: "/og-image.png", title: "BET PLUS+ sports betting" },
          { loc: "/games/hero-banner.jpg", title: "BET PLUS+ casino games" },
          ...c.heroSlides.filter(live).flatMap((s) => img(s.image, s.title || "BET PLUS+ promotion")),
        ],
      },
      {
        path: "/slot",
        images: [
          ...["1xgames", "burninghot", "crash", "crystal", "scratch", "solitaire", "western"].map((t) => ({
            loc: `/games/tile-${t}.jpg`,
            title: `${t} slot game on BET PLUS+`,
          })),
          ...c.slotSlides.filter(live).flatMap((s) => img(s.image, s.title || "BET PLUS+ slot")),
        ],
      },
      { path: "/lucky-winner", images: [{ loc: "/games/winner-celebration.png", title: "BET PLUS+ lucky winners" }] },
      ...winnerEntries.filter((e) => e.images?.length),
    ];
  }

  const m = /^(matches|results|leagues|teams)-(football|basketball|tennis)\.xml$/.exec(name);
  if (!m) return [];
  const kind = m[1]!;
  const sport = m[2] as Sport;
  const api = await import("@/lib/allsports.server");

  if (kind === "leagues") {
    const leagues = await api.fetchLeagues(sport);
    return leagues
      .filter((l) => l.key > 0)
      .flatMap((l) => [
        { path: `/?sport=${sport}&league=${l.key}`, changefreq: "daily" as const, priority: "0.7" },
        { path: `/standings?sport=${sport}&league=${l.key}`, changefreq: "daily" as const, priority: "0.6" },
      ]);
  }

  if (kind === "results") {
    const list = await api.fetchMatches({ sport, scope: "results", leagueId: null, countryId: null, leagueIds: null, countryIds: null });
    return list.map((x) => ({
      path: `/result-detail/${sport}/${x.id}`,
      changefreq: "weekly" as const,
      priority: "0.6",
    }));
  }

  const scopes = ["live", "today", "upcoming"] as const;
  const lists = await Promise.all(
    scopes.map((scope) =>
      api
        .fetchMatches({ sport, scope, leagueId: null, countryId: null, leagueIds: null, countryIds: null })
        .catch(() => []),
    ),
  );
  const matches = lists.flat();

  if (kind === "teams") {
    return matches.flatMap((x) =>
      [x.homeKey, x.awayKey]
        .filter((k) => k > 0)
        .map((k) => ({ path: `/team/${sport}/${k}`, changefreq: "weekly" as const, priority: "0.5" })),
    );
  }

  return matches.map((x) => ({
    path: `/match/${x.id}?sport=${sport}`,
    changefreq: "hourly" as const,
    priority: x.live ? "0.9" : "0.8",
  }));
}

/** Section sitemaps: pages, countries, games and live data per sport. */
export const Route = createFileRoute("/sitemaps/$name")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!SITEMAP_NAMES.includes(params.name)) return new Response("Not found", { status: 404 });
        try {
          return urlset(requestOrigin(request), await build(params.name));
        } catch (err) {
          console.error("sitemap failed", params.name, err);
          return new Response("Sitemap temporarily unavailable", { status: 503 });
        }
      },
    },
  },
});
