import type { WatermarkConfig } from "@/lib/types";

/**
 * Community edition: NEXT_PUBLIC_DEFAULT_PROTECT="true" makes every new
 * link start with screenshot protection on and a tiled watermark with the
 * viewer's email and the date. Downloads are always off by default.
 */
export const PROTECT_BY_DEFAULT =
  process.env.NEXT_PUBLIC_DEFAULT_PROTECT === "true";

export const DEFAULT_WATERMARK: WatermarkConfig = {
  text: "Confidential {{email}} {{date}}",
  isTiled: true,
  position: "middle-center",
  rotation: 45,
  color: "#808080",
  fontSize: 22,
  opacity: 0.15,
};
