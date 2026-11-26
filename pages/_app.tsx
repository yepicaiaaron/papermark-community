import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";

import { BRAND } from "@/community/brand/config";
import { TeamProvider } from "@/context/team-context";
import { UploadProgressProvider } from "@/context/upload-progress-context";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/pages";

import { EXCLUDED_PATHS } from "@/lib/constants";
import { useTrackLastVisited } from "@/lib/hooks/use-last-visited";

import { PostHogGroupSync } from "@/components/providers/posthog-group-sync";
import { PostHogCustomProvider } from "@/components/providers/posthog-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

function LastVisitedTracker() {
  useTrackLastVisited();
  return null;
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
  router,
}: AppProps<{ session: Session }>) {
  return (
    <>
      <Head>
        <title>
          {BRAND.custom
            ? BRAND.name
            : "Papermark | The Open Source DocSend Alternative"}
        </title>
        <meta name="theme-color" content="#000000" key="theme-color" />
        <meta
          name="description"
          content={
            BRAND.custom
              ? BRAND.tagline
              : "Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          }
          key="description"
        />
        <meta
          property="og:title"
          content={
            BRAND.custom
              ? BRAND.name
              : "Papermark | The Open Source DocSend Alternative"
          }
          key="og-title"
        />
        <meta
          property="og:description"
          content={
            BRAND.custom
              ? BRAND.tagline
              : "Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          }
          key="og-description"
        />
        <meta
          property="og:image"
          content={
            BRAND.custom
              ? BRAND.emailLogo || BRAND.logo
              : "https://www.papermark.com/_static/meta-image.png"
          }
          key="og-image"
        />
        <meta
          property="og:url"
          content={BRAND.custom ? BRAND.appUrl : "https://www.papermark.com"}
          key="og-url"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        {BRAND.custom ? null : (
          <meta name="twitter:site" content="@papermarkio" />
        )}
        {BRAND.custom ? null : (
          <meta name="twitter:creator" content="@papermarkio" />
        )}
        <meta name="twitter:title" content={BRAND.name} key="tw-title" />
        <meta
          name="twitter:description"
          content={
            BRAND.custom
              ? BRAND.tagline
              : "Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          }
          key="tw-description"
        />
        <meta
          name="twitter:image"
          content={
            BRAND.custom
              ? BRAND.emailLogo || BRAND.logo
              : "https://www.papermark.com/_static/meta-image.png"
          }
          key="tw-image"
        />
        <link rel="icon" href={BRAND.favicon} key="favicon" />
      </Head>
      <SessionProvider session={session}>
        <PostHogCustomProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <NuqsAdapter>
              <main className={inter.className}>
                <Toaster closeButton />
                <TooltipProvider delayDuration={100}>
                  {EXCLUDED_PATHS.includes(router.pathname) ? (
                    <Component {...pageProps} />
                  ) : (
                    <TeamProvider>
                      <PostHogGroupSync />
                      <LastVisitedTracker />
                      <UploadProgressProvider>
                        <Component {...pageProps} />
                      </UploadProgressProvider>
                    </TeamProvider>
                  )}
                </TooltipProvider>
              </main>
            </NuqsAdapter>
          </ThemeProvider>
        </PostHogCustomProvider>
      </SessionProvider>
    </>
  );
}
