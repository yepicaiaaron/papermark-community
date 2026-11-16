export type DataroomBannerKind = "none" | "image" | "video" | "youtube";

export type ClassifiedDataroomBanner = {
  kind: DataroomBannerKind;
  src: string | null;
  youtubeId?: string;
};

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function youtubeIdFrom(url: URL): string | null {
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") return url.pathname.slice(1) || null;
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/);
    if (match) return match[2];
  }
  return null;
}

/** Works out whether a banner value is an image, a video file or YouTube. */
export function classifyDataroomBanner(
  src: string | null | undefined,
): ClassifiedDataroomBanner {
  const value = src?.trim();
  if (!value || value === "no-banner") return { kind: "none", src: null };

  try {
    const url = new URL(value, "https://placeholder.local");
    const id = youtubeIdFrom(url);
    if (id && /^[\w-]{6,20}$/.test(id)) {
      return { kind: "youtube", src: value, youtubeId: id };
    }
  } catch {
    // not a URL; treat as a stored file key below
  }

  if (VIDEO_EXTENSIONS.test(value)) return { kind: "video", src: value };
  return { kind: "image", src: value };
}
