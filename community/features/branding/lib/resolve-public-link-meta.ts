export type ResolvedPublicLinkMeta = {
  enableCustomMetatag: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaImage: string | null;
  metaFavicon: string | null;
};

type PreviewFields = {
  customLinkPreviewEnabled?: boolean | null;
  linkPreviewTitle?: string | null;
  linkPreviewDescription?: string | null;
  linkPreviewImage?: string | null;
  linkPreviewFavicon?: string | null;
} | null;

/**
 * Social preview for a shared link: the link's own settings first, then the
 * data room or team brand's default preview, then the plain document title.
 */
export function resolvePublicLinkMeta({
  link,
  teamBrand,
  dataroomBrand,
  defaultTitle,
}: {
  link: ResolvedPublicLinkMeta;
  teamBrand: PreviewFields;
  dataroomBrand: PreviewFields;
  defaultTitle: string;
}): ResolvedPublicLinkMeta {
  if (link.enableCustomMetatag) {
    return {
      enableCustomMetatag: true,
      metaTitle: link.metaTitle || defaultTitle,
      metaDescription: link.metaDescription,
      metaImage: link.metaImage,
      metaFavicon: link.metaFavicon || "/favicon.ico",
    };
  }

  const brand = dataroomBrand ?? teamBrand;
  if (brand?.customLinkPreviewEnabled) {
    return {
      enableCustomMetatag: true,
      metaTitle: brand.linkPreviewTitle || defaultTitle,
      metaDescription: brand.linkPreviewDescription ?? null,
      metaImage: brand.linkPreviewImage ?? null,
      metaFavicon: brand.linkPreviewFavicon || "/favicon.ico",
    };
  }

  return {
    enableCustomMetatag: false,
    metaTitle: defaultTitle,
    metaDescription: null,
    metaImage: null,
    metaFavicon: "/favicon.ico",
  };
}
