import { useEffect, useMemo, useRef } from "react";

/**
 * Browser-style frame around a live preview page. The preview pages read
 * their settings from the query string on first load, then from messages
 * posted by this component, so typing never reloads the frame.
 */
export function BrandingPreviewChrome({
  name,
  basePath,
  urlLabel,
  params,
}: {
  name: string;
  basePath: string;
  urlLabel: string;
  params: Record<string, string | undefined | null>;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const clean = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) out[k] = v ?? "";
    return out;
  }, [params]);

  // Only the first set of params goes in the URL; later changes are posted.
  const initialSrc = useRef(
    `${basePath}?${new URLSearchParams(clean).toString()}`,
  ).current;

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: "branding-preview", params: clean },
      window.location.origin,
    );
  }, [clean]);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="ml-2 truncate text-xs text-muted-foreground">
          {urlLabel}
        </span>
      </div>
      <iframe
        ref={frameRef}
        name={name}
        title={`${name} preview`}
        src={initialSrc}
        className="h-[420px] w-full bg-white"
        onLoad={() =>
          frameRef.current?.contentWindow?.postMessage(
            { type: "branding-preview", params: clean },
            window.location.origin,
          )
        }
      />
    </div>
  );
}
