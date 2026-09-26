import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, User } from "lucide-react";
import { PageShell } from "@/components/xbet/PageShell";
import { useSiteContent } from "@/components/admin/AdminDataContext";
import { getWinnerSeo } from "@/lib/winner-seo.functions";
import { WinnerTicketSection } from "@/components/xbet/WinnerSections";

export const Route = createFileRoute("/winner-ticket/$winnerId")({
  loader: ({ params }) => getWinnerSeo({ data: { id: params.winnerId } }),
  head: ({ params, loaderData: w }) => {
    const path = `/winner-ticket/${params.winnerId}`;
    if (!w) return { meta: [{ title: "Winner — BET PLUS+" }, { name: "robots", content: "noindex" }] };
    const amt = `UGX ${Math.round(w.amount).toLocaleString("en-US")}`;
    const title = `Winning Ticket: ${w.name} won ${amt} | BET PLUS+`;
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
  component: WinnerTicketPage,
});

function WinnerTicketPage() {
  const { winnerId } = Route.useParams();
  const { content, ready } = useSiteContent();
  const router = useRouter();
  const featured = content.winners.find((w) => w.id === winnerId) ?? null;

  return (
    <PageShell fullBleed>
      <div className="flex h-full min-h-0 flex-col">
        <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-xb-line bg-xb-panel px-3 py-2">
          <button
            type="button"
            onClick={() => router.history.back()}
            aria-label="Back"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-xb-odds text-xb-text"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="min-w-0 truncate text-[12px] font-black uppercase tracking-wide text-xb-text">
            Winning ticket
          </h1>
          <Link
            to="/winner/$winnerId"
            params={{ winnerId }}
            className="flex shrink-0 items-center gap-1 rounded-full bg-xb-odds px-2.5 py-1 text-[10px] font-bold text-xb-text"
          >
            <User className="h-3 w-3" />
            Winner
          </Link>
        </div>

        {!ready ? (
          <p className="px-3 py-10 text-center text-[12px] text-xb-text-muted">Loading ticket…</p>
        ) : !featured ? (
          <p className="px-3 py-10 text-center text-[12px] text-xb-text-muted">
            This ticket is no longer published.
          </p>
        ) : (
          <section id="ticket-print" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <WinnerTicketSection featured={featured} />
          </section>
        )}
      </div>
    </PageShell>
  );
}
