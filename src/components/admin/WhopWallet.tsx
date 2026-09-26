import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Btn, Field, Panel, inputCls } from "@/components/admin/ui";
import { whopPayout, whopWallet } from "@/lib/whop.functions";
import { firebase } from "@/lib/firebase";

type Wallet = Awaited<ReturnType<typeof whopWallet>>;

/** Whop balance plus real payouts to your saved Whop payout method. */
export function WhopWallet() {
  const load = useServerFn(whopWallet);
  const pay = useServerFn(whopPayout);
  const [w, setW] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState(10);
  const [methodId, setMethodId] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const r = await load();
    setW(r);
    setMethodId((m) => m || r.payoutMethods.find((p) => p.isDefault)?.id || r.payoutMethods[0]?.id || "");
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const send = async () => {
    setBusy(true);
    try {
      const { auth } = await firebase();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sign in as admin first");
      const r = await pay({ data: { amount, currency: "USD", payoutMethodId: methodId, idToken } });
      toast.success("Whop payout sent", { description: r.status || r.id });
      void refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Whop balance & payouts (card, Google Pay, Apple Pay, PayPal)">
      {w?.error && <p className="text-[11px] text-xb-red">{w.error}</p>}
      <div className="flex flex-wrap gap-3 text-sm font-bold">
        {(w?.balances.length ? w.balances : [{ currency: "USD", balance: 0, pending: 0 }]).map((b) => (
          <span key={b.currency}>
            {b.currency} {b.balance.toFixed(2)}{" "}
            <span className="text-[11px] font-normal text-xb-text-muted">pending {b.pending.toFixed(2)}</span>
          </span>
        ))}
      </div>
      {w && w.payoutMethods.length === 0 ? (
        <p className="mt-2 text-[11px] text-xb-text-muted">
          No payout method yet — add a bank or wallet in your Whop dashboard (Payouts), then refresh.
        </p>
      ) : (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="Payout method">
            <select className={inputCls} value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              {w?.payoutMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (USD)">
            <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </Field>
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <Btn tone="red" onClick={() => void send()} disabled={busy || !methodId}>
          {busy ? "Sending…" : "Send Whop payout"}
        </Btn>
        <Btn onClick={() => void refresh()}>Refresh</Btn>
      </div>
    </Panel>
  );
}
