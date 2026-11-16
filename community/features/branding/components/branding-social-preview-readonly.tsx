export function BrandingSocialPreviewReadonly({
  title,
  description,
  image,
  favicon,
}: {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  favicon?: string | null;
}) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
      {image ? (
        <img
          src={image}
          alt=""
          className="aspect-[1.91/1] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-gray-100 text-xs text-muted-foreground dark:bg-gray-900">
          No preview image
        </div>
      )}
      <div className="space-y-1 p-3">
        <div className="flex items-center gap-2">
          {favicon ? <img src={favicon} alt="" className="h-4 w-4" /> : null}
          <p className="truncate text-sm font-medium">
            {title || "Shared document"}
          </p>
        </div>
        {description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
