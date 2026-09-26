/** Server-side read of public site content (winners, slides) via Firestore REST — works on Workers. */
import { firebaseConfig } from "./firebase-config";
import type { SiteContent, Winner } from "./admin-types";

type FsValue = Record<string, unknown>;

function decode(v: FsValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return Date.parse(String(v.timestampValue));
  if ("arrayValue" in v) {
    const vals = ((v.arrayValue as { values?: FsValue[] }).values ?? []);
    return vals.map(decode);
  }
  if ("mapValue" in v) {
    const f = ((v.mapValue as { fields?: Record<string, FsValue> }).fields ?? {});
    return Object.fromEntries(Object.entries(f).map(([k, x]) => [k, decode(x)]));
  }
  return undefined;
}

export async function fetchSiteContent(): Promise<SiteContent> {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/site/content?key=${firebaseConfig.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`site content ${res.status}`);
  const json = (await res.json()) as { fields?: Record<string, FsValue> };
  const f = json.fields ?? {};
  const get = (k: string) => (f[k] ? (decode(f[k]!) as unknown[]) : []);
  return {
    heroSlides: get("heroSlides") as SiteContent["heroSlides"],
    slotSlides: get("slotSlides") as SiteContent["slotSlides"],
    winners: get("winners") as Winner[],
  };
}

export async function fetchPublicWinners(): Promise<Winner[]> {
  const c = await fetchSiteContent();
  return c.winners.filter((w) => w && w.active).sort((a, b) => b.at - a.at);
}
