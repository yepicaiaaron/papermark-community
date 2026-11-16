import { useState } from "react";

import { classifyDataroomBanner } from "@/community/features/branding/lib/dataroom-banner";

import { convertDataUrlToFile } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataroomBannerMedia } from "@/components/view/dataroom/dataroom-banner-media";

/**
 * Banner for the data room viewer: upload a PNG or JPG, or paste a link to
 * an image, a video file or a YouTube video.
 */
export function BannerEditor({
  banner,
  setBanner,
  setBannerBlobUrl,
  sizeHint = "(max 2 MB)",
  defaultBannerImage,
  onUrlApplied,
  dropZone,
}: {
  banner: string | null;
  setBanner: (value: string | null) => void;
  setBannerBlobUrl: (value: string | null) => void;
  sizeHint?: string;
  defaultBannerImage?: string;
  onUrlApplied?: () => void;
  /** Optional custom upload area; replaces the default preview and upload link. */
  dropZone?: React.ReactNode;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (file.size / 1024 / 1024 > 2) {
      setError("File size too big (max 2 MB)");
      return;
    }
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setError("File type not supported (.png or .jpg only)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setBanner(dataUrl);
      setBannerBlobUrl(URL.createObjectURL(convertDataUrlToFile({ dataUrl })));
    };
    reader.readAsDataURL(file);
  };

  const applyUrl = () => {
    setError(null);
    const value = url.trim();
    if (!value) return;
    if (!/^https:\/\//i.test(value)) {
      setError("Use a link that starts with https://");
      return;
    }
    if (classifyDataroomBanner(value).kind === "none") {
      setError("That link doesn't look like an image or video");
      return;
    }
    setBanner(value);
    setBannerBlobUrl(null);
    setUrl("");
    onUrlApplied?.();
  };

  const preview =
    banner && banner !== "no-banner" ? banner : defaultBannerImage;

  return (
    <div className="space-y-3">
      {dropZone ? (
        dropZone
      ) : (
        <>
          <div className="relative aspect-[4/1] w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            {preview ? (
              <DataroomBannerMedia src={preview} alt="Banner preview" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No banner
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer text-sm underline underline-offset-4">
              Upload image {sizeHint}
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
            {banner ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBanner("no-banner");
                  setBannerBlobUrl(null);
                }}
              >
                Remove banner
              </Button>
            ) : null}
          </div>
        </>
      )}
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Or paste an image, video or YouTube link"
        />
        <Button type="button" variant="outline" onClick={applyUrl}>
          Use link
        </Button>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
