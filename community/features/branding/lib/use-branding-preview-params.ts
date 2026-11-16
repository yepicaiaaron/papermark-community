import { useRouter } from "next/router";

import { useEffect, useState } from "react";

type PreviewParams = Record<string, string | undefined>;

/**
 * Settings for the branding preview pages: first from the query string,
 * then from messages sent by BrandingPreviewChrome in the parent page.
 */
export function useBrandingPreviewParams(): PreviewParams {
  const router = useRouter();
  const [params, setParams] = useState<PreviewParams>({});

  useEffect(() => {
    if (!router.isReady) return;
    const fromQuery: PreviewParams = {};
    for (const [k, v] of Object.entries(router.query)) {
      fromQuery[k] = Array.isArray(v) ? v[0] : v;
    }
    setParams((prev) => ({ ...fromQuery, ...prev }));
  }, [router.isReady, router.query]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; params?: PreviewParams };
      if (data?.type === "branding-preview" && data.params) {
        setParams(data.params);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return params;
}
