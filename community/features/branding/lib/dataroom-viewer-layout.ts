import { z } from "zod";

export const DataroomCardLayoutSchema = z.enum(["LIST", "GRID", "COMPACT"]);
export type DataroomCardLayout = z.infer<typeof DataroomCardLayoutSchema>;

export const DataroomViewerHeaderStyleSchema = z.enum([
  "DEFAULT",
  "SPLIT",
  "NOTION",
]);
export type DataroomViewerHeaderStyle = z.infer<
  typeof DataroomViewerHeaderStyleSchema
>;

/** The four ready-made looks, plus CUSTOM for any other combination. */
export const DataroomViewerLayoutPresetSchema = z.enum([
  "STANDARD",
  "STRICT",
  "MODERN",
  "NOTION",
  "CUSTOM",
]);
export type DataroomViewerLayoutPreset = z.infer<
  typeof DataroomViewerLayoutPresetSchema
>;
export type DataroomLayoutCardId = Exclude<
  DataroomViewerLayoutPreset,
  "CUSTOM"
>;

export const CARD_LAYOUT_OPTIONS: {
  value: DataroomCardLayout;
  label: string;
}[] = [
  { value: "LIST", label: "List" },
  { value: "GRID", label: "Grid" },
  { value: "COMPACT", label: "Compact" },
];

export function asDataroomCardLayout(value: unknown): DataroomCardLayout {
  const parsed = DataroomCardLayoutSchema.safeParse(value);
  return parsed.success ? parsed.data : "LIST";
}

export function asDataroomViewerHeaderStyle(
  value: unknown,
): DataroomViewerHeaderStyle {
  const parsed = DataroomViewerHeaderStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : "DEFAULT";
}

type LayoutSettings = {
  cardLayout: DataroomCardLayout;
  showFolderTree: boolean;
  hideFolderIconsInMain: boolean;
  viewerHeaderStyle: DataroomViewerHeaderStyle;
};

export const DATAROOM_LAYOUT_PRESETS: Record<
  DataroomLayoutCardId,
  LayoutSettings
> = {
  STANDARD: {
    cardLayout: "LIST",
    showFolderTree: true,
    hideFolderIconsInMain: false,
    viewerHeaderStyle: "DEFAULT",
  },
  STRICT: {
    cardLayout: "COMPACT",
    showFolderTree: false,
    hideFolderIconsInMain: true,
    viewerHeaderStyle: "DEFAULT",
  },
  MODERN: {
    cardLayout: "COMPACT",
    showFolderTree: false,
    hideFolderIconsInMain: true,
    viewerHeaderStyle: "SPLIT",
  },
  NOTION: {
    cardLayout: "GRID",
    showFolderTree: false,
    hideFolderIconsInMain: false,
    viewerHeaderStyle: "NOTION",
  },
};

export function inferDataroomViewerLayoutPreset(
  settings: LayoutSettings,
): DataroomViewerLayoutPreset {
  for (const [id, preset] of Object.entries(DATAROOM_LAYOUT_PRESETS)) {
    if (
      preset.cardLayout === settings.cardLayout &&
      preset.showFolderTree === settings.showFolderTree &&
      preset.hideFolderIconsInMain === settings.hideFolderIconsInMain &&
      preset.viewerHeaderStyle === settings.viewerHeaderStyle
    ) {
      return id as DataroomLayoutCardId;
    }
  }
  return "CUSTOM";
}
