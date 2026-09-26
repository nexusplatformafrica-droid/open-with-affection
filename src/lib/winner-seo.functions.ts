import { createServerFn } from "@tanstack/react-start";

/** Public winner summary for search-engine metadata. */
export const getWinnerSeo = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: String(d.id).slice(0, 100) }))
  .handler(async ({ data }) => {
    try {
      const { fetchPublicWinners } = await import("./site-content.server");
      const w = (await fetchPublicWinners()).find((x) => x.id === data.id);
      if (!w) return null;
      return {
        id: w.id,
        name: w.name,
        amount: w.amount,
        location: w.location ?? "",
        game: w.game ?? "Sports multibet",
        quote: w.quote ?? "",
        image: /^https?:\/\//.test(w.image ?? "") ? w.image : "",
        at: w.at,
        legs: w.ticket?.legs.length ?? 0,
        stake: w.ticket?.stake ?? 0,
      };
    } catch {
      return null;
    }
  });
