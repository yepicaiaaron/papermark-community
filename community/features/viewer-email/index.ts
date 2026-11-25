import { promises as dns } from "node:dns";

import { redis } from "@/lib/redis";

import disposableDomains from "./disposable-domains.json";
import disposableWildcards from "./disposable-wildcards.json";
import freeDomains from "./free-domains.json";

/**
 * Community edition: only let viewers in with a work email.
 *
 * Turned on with COMMUNITY_VIEWER_EMAIL_POLICY="business". A viewer's email
 * must not be a free personal provider (Gmail, Outlook and so on) or a
 * disposable/burner address, and its domain must receive email (MX record)
 * and have a working website. Emails or @domains on a link's own allow list
 * always get through, so you can still let a specific person in.
 */

const FREE = new Set<string>(freeDomains as string[]);
const DISPOSABLE = new Set<string>(disposableDomains as string[]);
const DISPOSABLE_WILDCARDS = disposableWildcards as string[];

const CACHE_SECONDS = 7 * 24 * 60 * 60;
const TIMEOUT_MS = 4000;

export type ViewerEmailCheck =
  | { ok: true }
  | { ok: false; message: string };

export function businessEmailPolicyEnabled() {
  return process.env.COMMUNITY_VIEWER_EMAIL_POLICY === "business";
}

function parentDomains(domain: string) {
  const parts = domain.split(".");
  const out: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    out.push(parts.slice(i).join("."));
  }
  return out;
}

function isListed(domain: string) {
  for (const d of parentDomains(domain)) {
    if (FREE.has(d)) return "free" as const;
    if (DISPOSABLE.has(d)) return "disposable" as const;
  }
  if (DISPOSABLE_WILDCARDS.some((w) => domain === w || domain.endsWith(`.${w}`))) {
    return "disposable" as const;
  }
  return null;
}

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

async function hasMx(domain: string) {
  try {
    const records = await withTimeout(dns.resolveMx(domain));
    return records.some((r) => r.exchange && r.exchange !== ".");
  } catch {
    return false;
  }
}

async function siteResponds(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DocsLinkCheck/1.0)" },
    });
    // Any real answer from a web server counts, even 401/403 from bot
    // protection; 5xx or no answer does not.
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function hasWebsite(domain: string) {
  const candidates = [
    `https://${domain}`,
    `https://www.${domain}`,
    `http://${domain}`,
  ];
  for (const url of candidates) {
    if (await siteResponds(url)) return true;
  }
  return false;
}

async function domainVerdict(domain: string): Promise<string | null> {
  const cacheKey = `viewer-email-domain:${domain}`;
  try {
    const cached = await redis.get<string>(cacheKey);
    if (cached) return cached === "ok" ? null : cached;
  } catch {
    // no cache available
  }

  let verdict: string | null = null;
  const [mx, site] = await Promise.all([hasMx(domain), hasWebsite(domain)]);
  if (!mx) verdict = "That email domain can't receive email.";
  else if (!site) verdict = "Please use an email at a company with a website.";

  try {
    await redis.set(cacheKey, verdict ?? "ok", { ex: CACHE_SECONDS });
  } catch {
    // ignore
  }
  return verdict;
}

function onAllowList(email: string, allowList: string[] | undefined | null) {
  const e = email.toLowerCase();
  return (allowList ?? []).some((entry) => {
    const rule = entry.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith("@")) return e.endsWith(rule);
    if (!rule.includes("@")) return e.endsWith(`@${rule}`);
    return e === rule;
  });
}

export async function checkViewerEmail(
  email: string,
  allowList?: string[] | null,
): Promise<ViewerEmailCheck> {
  if (!businessEmailPolicyEnabled()) return { ok: true };
  if (onAllowList(email, allowList)) return { ok: true };

  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain || !domain.includes(".")) {
    return { ok: false, message: "Invalid email address." };
  }

  const listed = isListed(domain);
  if (listed === "free") {
    return {
      ok: false,
      message:
        "Please use your work email. Personal addresses (like Gmail or Outlook) can't be used to view this.",
    };
  }
  if (listed === "disposable") {
    return {
      ok: false,
      message: "Temporary or disposable email addresses can't be used.",
    };
  }

  const verdict = await domainVerdict(domain);
  if (verdict) return { ok: false, message: verdict };
  return { ok: true };
}
