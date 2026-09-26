import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Your Whop business account (Nexusplatform). */
const COMPANY_ID = "biz_k2ByTZwELx3wJk";
const API = "https://api.whop.com/api/v1";

async function whop(path: string, init: RequestInit = {}) {
  const key = process.env["WHOP_API_KEY"];
  if (!key) throw new Error("Whop is not configured");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = body["error"] as { message?: string } | undefined;
    console.error("Whop error", path, res.status, err?.message);
    throw new Error(err?.message ?? `Whop request failed (${res.status})`);
  }
  return body;
}

/** Creates a one-off Whop checkout for a deposit; the plan id is unique per checkout. */
export const createWhopCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        amountUsd: z.number().min(1).max(10000),
        reference: z.string().min(3).max(60),
        userId: z.string().min(1).max(128),
        method: z.string().max(40),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const res = await whop("/checkout_configurations", {
      method: "POST",
      body: JSON.stringify({
        mode: "payment",
        plan: {
          company_id: COMPANY_ID,
          currency: "usd",
          initial_price: Math.round(data.amountUsd * 100) / 100,
          plan_type: "one_time",
        },
        metadata: { reference: data.reference, user_id: data.userId, method: data.method },
      }),
    });
    const plan = res["plan"] as { id: string };
    return { id: String(res["id"]), planId: plan.id, purchaseUrl: String(res["purchase_url"] ?? "") };
  });

/** Reads the real payment outcome for a checkout plan straight from Whop. */
export const whopPlanStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ planId: z.string().regex(/^plan_\w+$/) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await whop(
        `/payments?company_id=${COMPANY_ID}&plan_ids[]=${encodeURIComponent(data.planId)}`,
      );
      const list = (res["data"] as Array<Record<string, unknown>>) ?? [];
      if (list.length === 0) return { state: "unknown" as const };
      const statuses = list.map((p) => `${p["status"] ?? ""} ${p["substatus"] ?? ""}`.toLowerCase());
      if (statuses.some((s) => /paid|succeeded/.test(s))) return { state: "success" as const };
      if (statuses.every((s) => /fail|void|refund|cancel/.test(s))) return { state: "failed" as const };
      return { state: "pending" as const };
    } catch {
      return { state: "unknown" as const };
    }
  });

/** Admin: Whop balance and saved payout methods. */
export const whopWallet = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [ledger, methods] = await Promise.all([
      whop(`/ledger_accounts/${COMPANY_ID}`),
      whop(`/payout_methods?company_id=${COMPANY_ID}`),
    ]);
    const balances = ((ledger["balances"] as Array<Record<string, unknown>>) ?? []).map((b) => ({
      currency: String(b["currency"] ?? "usd").toUpperCase(),
      balance: Number(b["balance"] ?? 0),
      pending: Number(b["pending_balance"] ?? 0),
    }));
    const payoutMethods = ((methods["data"] as Array<Record<string, unknown>>) ?? []).map((m) => ({
      id: String(m["id"]),
      label: String(m["nickname"] ?? m["institution_name"] ?? m["id"]),
      isDefault: Boolean(m["is_default"]),
    }));
    return { balances, payoutMethods, error: null as string | null };
  } catch (e) {
    return { balances: [], payoutMethods: [], error: (e as Error).message };
  }
});

/** Admin: send a payout from the Whop balance to a saved payout method. */
export const whopPayout = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        amount: z.number().min(1),
        currency: z.string().length(3),
        payoutMethodId: z.string().min(3),
        idToken: z.string().min(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    // Verify the caller is the signed-in admin before moving any money.
    const { firebaseConfig } = await import("./firebase-config");
    const { ADMIN_EMAIL, ADMIN_PHONE, authEmailFor } = await import("./identity");
    const look = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: data.idToken }) },
    );
    const who = (await look.json().catch(() => ({}))) as { users?: Array<{ email?: string }> };
    const email = (who.users?.[0]?.email ?? "").toLowerCase();
    if (!look.ok || (email !== ADMIN_EMAIL && email !== authEmailFor(ADMIN_PHONE))) {
      throw new Error("Only the admin can send payouts");
    }
    const res = await whop("/payouts", {
      method: "POST",
      body: JSON.stringify({
        company_id: COMPANY_ID,
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        payout_method_id: data.payoutMethodId,
      }),
    });
    return { id: String(res["id"] ?? ""), status: String(res["status"] ?? "") };
  });
