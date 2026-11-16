import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { BrandingSocialPreviewReadonly } from "./branding-social-preview-readonly";

/** Default social preview (title, description, image, favicon) for links. */
export function BrandingLinkPreviewForm({
  enabled,
  onEnabledChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  imageUrl,
  onImageChange,
  faviconUrl,
  onFaviconChange,
  inheritanceHint,
}: {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  title: string | null;
  onTitleChange: (v: string) => void;
  description: string | null;
  onDescriptionChange: (v: string) => void;
  imageUrl: string | null;
  onImageChange: (v: string | null) => void;
  faviconUrl: string | null;
  onFaviconChange: (v: string | null) => void;
  inheritanceHint?: string;
}) {
  const readImage = (file: File | undefined, set: (v: string) => void) => {
    if (!file || file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => set(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Custom link preview</Label>
          {inheritanceHint ? (
            <p className="text-xs text-muted-foreground">{inheritanceHint}</p>
          ) : null}
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
      {enabled ? (
        <div className="space-y-3">
          <Input
            value={title ?? ""}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Title"
            maxLength={120}
          />
          <Textarea
            value={description ?? ""}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Description"
            maxLength={300}
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="cursor-pointer underline underline-offset-4">
              Preview image (1200 x 630)
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                onChange={(e) => readImage(e.target.files?.[0], onImageChange)}
              />
            </label>
            <label className="cursor-pointer underline underline-offset-4">
              Favicon
              <input
                type="file"
                accept="image/png,image/x-icon,image/svg+xml"
                className="sr-only"
                onChange={(e) =>
                  readImage(e.target.files?.[0], onFaviconChange)
                }
              />
            </label>
          </div>
          <BrandingSocialPreviewReadonly
            title={title}
            description={description}
            image={imageUrl}
            favicon={faviconUrl}
          />
        </div>
      ) : null}
    </div>
  );
}
