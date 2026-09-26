import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/xbet/PageShell";
import { PAY_COUNTRIES } from "@/lib/payments";

export const Route = createFileRoute("/betting/$country")({
  loader: ({ params }) => {
    const c = PAY_COUNTRIES.find((x) => x.code.toLowerCase() === params.country.toLowerCase());
    if (!c) throw notFound();
    return { code: c.code, name: c.name, flag: c.flag, currency: c.currency, methods: c.methods.map((m) => m.label), min: c.minMobile };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Country not found — BET PLUS+" }, { name: "robots", content: "noindex" }] };
    const t = `BetPlus ${loaderData.name} — Online Sports Betting, Aviator & Virtuals | BET PLUS+`;
    const d = `Bet online in ${loaderData.name} with BET PLUS+ (BetPlus): live football odds, virtual soccer, Aviator and slots. Deposit and withdraw in ${loaderData.currency} with ${loaderData.methods.join(", ")}.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/betting/${params.country}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/betting/${params.country.toLowerCase()}` }],
    };
  },
  notFoundComponent: () => <PageShell title="Country not supported"><p className="text-xb-text-muted">We don't operate in this country yet.</p></PageShell>,
  component: CountryPage,
});

function CountryPage() {
  const c = Route.useLoaderData();
  return (
    <PageShell title={`${c.flag} BET PLUS+ ${c.name}`} subtitle={`Sports betting, virtuals and casino games for players in ${c.name}.`}>
      <div className="space-y-3">
        <section className="rounded-2xl bg-xb-panel p-4 md:p-5">
          <h2 className="text-lg font-black text-xb-text">Betting in {c.name} with BetPlus</h2>
          <p className="mt-2 text-sm leading-relaxed text-xb-text-muted">
            BET PLUS+ gives players in {c.name} live odds on football, basketball and tennis — Premier League, La Liga,
            Serie A, Bundesliga, Champions League, AFCON and local leagues — plus virtual soccer, the Aviator crash game
            and slots. Your wallet runs in {c.currency}.
          </p>
        </section>
        <section className="rounded-2xl bg-xb-panel p-4 md:p-5">
          <h2 className="text-lg font-black text-xb-text">Deposit and withdraw in {c.name}</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-xb-text-muted">
            {c.methods.map((m) => <li key={m}>{m}</li>)}
          </ul>
          <p className="mt-2 text-sm text-xb-text-muted">Minimum mobile deposit: {c.min.toLocaleString()} {c.currency}.</p>
          <Link to="/payment-methods" className="mt-2 inline-block text-sm font-bold text-xb-blue">All payment methods →</Link>
        </section>
        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {([["/", "Football odds today"], ["/virtual", "Virtual soccer"], ["/aviator", "Aviator"], ["/results", "Results"]] as const).map(([to, label]) => (
            <Link key={to} to={to} className="rounded-xl bg-xb-panel p-4 text-sm font-bold text-xb-text">{label} →</Link>
          ))}
        </section>
        <nav className="rounded-2xl bg-xb-panel p-4 text-sm text-xb-text-muted">
          Other countries:{" "}
          {PAY_COUNTRIES.filter((x) => x.code !== c.code).map((x) => (
            <Link key={x.code} to="/betting/$country" params={{ country: x.code.toLowerCase() }} className="mr-3 font-bold text-xb-blue">{x.name}</Link>
          ))}
        </nav>
      </div>
    </PageShell>
  );
}
