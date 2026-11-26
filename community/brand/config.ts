/**
 * Community edition: run the app under your own name and logo.
 *
 * NEXT_PUBLIC_BRAND_NAME      e.g. "StoryMachine"
 * NEXT_PUBLIC_BRAND_LOGO_URL  square or wide logo (SVG/PNG URL)
 * NEXT_PUBLIC_BRAND_TAGLINE   line under the sign-in heading
 * NEXT_PUBLIC_BRAND_URL       your website (logo link, footer)
 *
 * When a brand name is set, Papermark's marketing (testimonials, logo
 * cloud, "Powered by" badge, terms links) is hidden.
 */
export const BRAND = {
  custom: Boolean(process.env.NEXT_PUBLIC_BRAND_NAME),
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Papermark",
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || "/_static/papermark-logo.svg",
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ||
    "Share documents. Not attachments.",
  url: process.env.NEXT_PUBLIC_BRAND_URL || "/",
  favicon: process.env.NEXT_PUBLIC_BRAND_FAVICON_URL || "/favicon.ico",
  /**
   * NEXT_PUBLIC_BRAND_EMAIL_LOGO_URL  logo for emails. Must be PNG or JPG
   * (most email apps don't show SVG). Falls back to the favicon if that is a
   * PNG or JPG, otherwise emails show the brand name only.
   */
  emailLogo:
    process.env.NEXT_PUBLIC_BRAND_EMAIL_LOGO_URL ||
    (/\.(png|jpe?g|gif)$/i.test(process.env.NEXT_PUBLIC_BRAND_FAVICON_URL ?? "")
      ? (process.env.NEXT_PUBLIC_BRAND_FAVICON_URL as string)
      : ""),
  /** Where the app itself lives, for links in emails. */
  appUrl: (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, ""),
};

/** Absolute link into the app, e.g. appUrl("/documents/123"). */
export const appUrl = (path = "") =>
  `${BRAND.appUrl}${path.startsWith("/") || !path ? path : `/${path}`}`;
