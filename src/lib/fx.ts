import { useEffect, useState } from "react";
import { getFxRates } from "./fx.functions";

let cache: { at: number; rates: Record<string, number> } | null = null;
let inflight: Promise<Record<string, number>> | null = null;
const TTL = 10 * 60 * 1000;

/** Live USD-based exchange rates, cached for 10 minutes. */
export async function loadRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < TTL) return cache.rates;
  inflight ??= getFxRates()
    .then((r) => {
      cache = { at: Date.now(), rates: r.rates };
      return r.rates;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function convert(amount: number, from: string, to: string, rates: Record<string, number>) {
  if (from === to) return amount;
  const a = rates[from.toUpperCase()];
  const b = rates[to.toUpperCase()];
  if (!a || !b) return null;
  return (amount / a) * b;
}

export function useFxRates() {
  const [rates, setRates] = useState<Record<string, number> | null>(cache?.rates ?? null);
  useEffect(() => {
    let alive = true;
    const run = () => void loadRates().then((r) => alive && setRates(r)).catch(() => undefined);
    run();
    const t = setInterval(run, TTL);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return rates;
}
