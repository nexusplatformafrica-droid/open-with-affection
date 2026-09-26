import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Ticket } from "lucide-react";
import { PageShell } from "@/components/xbet/PageShell";
import { useSiteContent } from "@/components/admin/AdminDataContext";
import { getWinnerSeo } from "@/lib/winner-seo.functions";
import { WinnerDetailsSection, WinnerTicketSection } from "@/components/xbet/WinnerSections";

export const Route = createFileRoute("/winner/$winnerId")({
  loader: ({ params }) => getWinnerSeo({ data: { id: params.winnerId } }),
  head: ({ params, loaderData: w }) => {
    const path = `/winner/${params.winnerId}`;
    if (!w) return { meta: [{ title: "Winner — BET PLUS+" }, { name: "robots", content: "noindex" }] };
    const amt = `UGX ${Math.round(w.amount).toLocaleString("en-US")}`;
    const title = `${w.name} won ${amt} — Lucky Winner | BET PLUS+`;
    const desc = `${w.name}${w.location ? " from " + w.location : ""} won ${amt} on ${w.game} at BET PLUS+${w.legs ? `, a ${w.legs}-selection ticket` : ""}. ${w.quote}`.slice(0, 300);
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: path },
      { name: "twitter:card", content: "summary_large_image" },
      ...(w.image ? [{ property: "og:image", content: w.image }, { name: "twitter:image", content: w.image }] : []),
    ];
    return {
      meta,
      links: [{ rel: "canonical", href: path }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: desc,
          datePublished: new Date(w.at).toISOString(),
          ...(w.image ? { image: [w.image] } : {}),
          author: { "@type": "Organization", name: "BET PLUS+" },
          publisher: { "@type": "Organization", name: "BET PLUS+" },
        }),
      }],
    };
  },
  component: WinnerDetailPage,
});

function WinnerDetailPage() {
  const { winnerId } = Route.useParams();
  const { content, ready } = useSiteContent();
  const router = useRouter();
  const featured = content.winners.find((w) => w.id === winnerId) ?? null;

  return (
    <PageShell>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-xb-line bg-xb-panel px-3 py-2">
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Back to winners"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-xb-odds text-xb-text"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="min-w-0 truncate text-[12px] font-black uppercase tracking-wide text-xb-text">
          Winner details
        </h1>
        <Link
          to="/winner-ticket/$winnerId"
          params={{ winnerId }}
          className="flex shrink-0 items-center gap-1 rounded-full bg-xb-blue px-2.5 py-1 text-[10px] font-bold text-xb-on-dark"
        >
          <Ticket className="h-3 w-3" />
          Ticket
        </Link>
      </div>

      {!ready ? (
        <p className="px-3 py-10 text-center text-[12px] text-xb-text-muted">Loading winner…</p>
      ) : !featured ? (
        <p className="px-3 py-10 text-center text-[12px] text-xb-text-muted">
          This winner is no longer published.
        </p>
      ) : (
        <div className="flex flex-col gap-2 p-2">
          <WinnerDetailsSection featured={featured} />
          {/* Mobile only — the winning ticket right under the winner's talk */}
          <div
            id="ticket-print"
            className="flex flex-col overflow-hidden rounded-xl bg-xb-panel shadow-sm md:hidden"
          >
            <WinnerTicketSection featured={featured} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
