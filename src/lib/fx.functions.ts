import { createServerFn } from "@tanstack/react-start";

/** Live exchange rates (base USD). */
export const getFxRates = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const body = (await res.json()) as { rates?: Record<string, number> };
    return { rates: body.rates ?? { USD: 1 } };
  } catch {
    return { rates: { USD: 1 } as Record<string, number> };
  }
});
