import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requestOrigin, sitemapIndex, SITEMAP_NAMES } from "@/lib/seo-sitemap";

/** Master sitemap index pointing at every section sitemap. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => sitemapIndex(requestOrigin(request), SITEMAP_NAMES),
    },
  },
});
