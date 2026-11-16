import { useCallback, useState } from "react";

/**
 * Works out whether a logo is mostly light or dark, so it can sit on a
 * contrasting chip. Falls back to "dark" when pixels can't be read (for
 * example when the image host blocks cross-origin reads).
 */
export function useLogoTone(src: string | null | undefined) {
  const [tone, setTone] = useState<"light" | "dark">("dark");

  const onLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let total = 0;
        let weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] / 255;
          if (alpha < 0.1) continue;
          const lum =
            0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          total += lum * alpha;
          weight += alpha;
        }
        if (weight > 0) setTone(total / weight > 186 ? "light" : "dark");
      } catch {
        setTone("dark");
      }
    },
    [],
  );

  return {
    tone,
    imgProps: { onLoad },
  };
}
