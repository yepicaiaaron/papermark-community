import { Prisma } from "@prisma/client";
import { z } from "zod";

import { validateRedirectUrl } from "@/lib/api/domains/validate-redirect-url";
import { SUPPORTED_LOCALE_CODES } from "@/lib/i18n/locales";

import {
  DataroomCardLayoutSchema,
  DataroomViewerHeaderStyleSchema,
  DataroomViewerLayoutPresetSchema,
} from "./dataroom-viewer-layout";

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const brandWriteSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  logo: z.string().nullable().optional(),
  hideLogo: z.boolean().optional(),
  banner: z.string().nullable().optional(),
  brandColor: nullableText(32),
  accentColor: nullableText(32),
  accentButtonColor: nullableText(32),
  applyAccentColorToDataroomView: z.boolean().optional(),
  welcomeMessage: nullableText(2000),
  ctaLabel: nullableText(60),
  ctaUrl: nullableText(2048),
  privacyPolicyUrl: nullableText(2048),
  customLinkPreviewEnabled: z.boolean().optional(),
  linkPreviewTitle: nullableText(200),
  linkPreviewDescription: nullableText(500),
  linkPreviewImage: z.string().nullable().optional(),
  linkPreviewFavicon: z.string().nullable().optional(),
  cardLayout: DataroomCardLayoutSchema.optional(),
  showFolderTree: z.boolean().optional(),
  viewerLayoutPreset: DataroomViewerLayoutPresetSchema.optional(),
  viewerHeaderStyle: DataroomViewerHeaderStyleSchema.optional(),
  hideFolderIconsInMain: z.boolean().optional(),
  defaultLanguage: z
    .string()
    .refine((v) => (SUPPORTED_LOCALE_CODES as readonly string[]).includes(v))
    .optional(),
});

type BrandWriteData = Omit<
  Prisma.BrandUncheckedCreateInput,
  "teamId" | "id" | "name"
> & { name: string };

type Prepared =
  | {
      ok: true;
      data: BrandWriteData;
    }
  | {
      ok: false;
      status: number;
      message: string;
      errors?: unknown;
    };

/**
 * Validates a create or update request for a team brand and returns the
 * fields to write. Every feature is available in the community edition, so
 * the plan is not checked.
 */
export async function prepareBrandWrite({
  body,
  teamId,
  nameRequired = false,
}: {
  body: unknown;
  teamId: string;
  plan?: string;
  nameRequired?: boolean;
}): Promise<Prepared> {
  const parsed = brandWriteSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: "Invalid brand settings",
      errors: parsed.error.flatten(),
    };
  }
  const input = parsed.data;
  if (nameRequired && !input.name) {
    return { ok: false, status: 400, message: "Brand name is required" };
  }

  for (const field of ["ctaUrl", "privacyPolicyUrl"] as const) {
    const value = input[field];
    if (typeof value === "string" && value.length > 0) {
      const check = await validateRedirectUrl(value, teamId);
      if (!check.valid) {
        return { ok: false, status: 400, message: check.message };
      }
      input[field] = check.url;
    }
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) data[key] = value === "" ? null : value;
  }

  return {
    ok: true,
    data: data as BrandWriteData,
  };
}
