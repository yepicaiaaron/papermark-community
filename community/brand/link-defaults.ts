import type { WatermarkConfig } from "@/lib/types";

/**
 * Community edition link defaults. Downloads are always off by default.
 * NEXT_PUBLIC_DEFAULT_PROTECT="true": screenshot protection on for new links.
 * NEXT_PUBLIC_DEFAULT_WATERMARK="true": also a tiled watermark with the
 * viewer's email and the date.
 */
export const PROTECT_BY_DEFAULT =
  process.env.NEXT_PUBLIC_DEFAULT_PROTECT === "true";

export const WATERMARK_BY_DEFAULT =
  process.env.NEXT_PUBLIC_DEFAULT_WATERMARK === "true";

export const DEFAULT_WATERMARK: WatermarkConfig = {
  text: "Confidential {{email}} {{date}}",
  isTiled: true,
  position: "middle-center",
  rotation: 45,
  color: "#808080",
  fontSize: 22,
  opacity: 0.15,
};
