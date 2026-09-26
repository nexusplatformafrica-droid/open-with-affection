import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/xbet/PageShell";
import { PAY_COUNTRIES } from "@/lib/payments";

const TITLE = "Payment Methods — Mobile Money Deposits & Withdrawals | BET PLUS+";
const DESC = "How to deposit and withdraw at BET PLUS+ (BetPlus) with MTN Mobile Money, Airtel Money, M-Pesa and more in Uganda, Kenya, Tanzania, Rwanda and DR Congo.";

export const Route = createFileRoute("/payment-methods")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/payment-methods" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/payment-methods" }],
  }),
  component: PaymentMethodsPage,
});

function PaymentMethodsPage() {
  return (
    <PageShell title="Payment methods" subtitle="Deposit and withdraw with the mobile money you already use.">
      <div className="space-y-3">
        <section className="rounded-2xl bg-xb-panel p-4 md:p-5">
          <h2 className="text-lg font-black text-xb-text">How to deposit</h2>
          <ol className="mt-2 list-decimal pl-5 text-sm leading-relaxed text-xb-text-muted">
            <li>Log in and open your account menu.</li>
            <li>Choose Deposit and pick your network.</li>
            <li>Enter the amount and confirm the prompt on your phone.</li>
          </ol>
          <p className="mt-2 text-sm text-xb-text-muted">Withdrawals go back to the same mobile money number.</p>
        </section>
        <div className="grid gap-3 md:grid-cols-2">
          {PAY_COUNTRIES.map((c) => (
            <section key={c.code} className="rounded-2xl bg-xb-panel p-4">
              <h2 className="text-base font-black text-xb-text">{c.flag} {c.name} ({c.currency})</h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-xb-text-muted">
                {c.methods.map((m) => <li key={m.id}>{m.label}</li>)}
              </ul>
              <p className="mt-1 text-xs text-xb-text-muted">Mobile: {c.minMobile.toLocaleString()} – {c.maxMobile.toLocaleString()} {c.currency}</p>
              <Link to="/betting/$country" params={{ country: c.code.toLowerCase() }} className="mt-2 inline-block text-sm font-bold text-xb-blue">Betting in {c.name} →</Link>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
