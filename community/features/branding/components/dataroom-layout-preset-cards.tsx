import {
  DATAROOM_LAYOUT_PRESETS,
  type DataroomLayoutCardId,
  type DataroomViewerLayoutPreset,
} from "@/community/features/branding/lib/dataroom-viewer-layout";

import { cn } from "@/lib/utils";

const LABELS: Record<DataroomLayoutCardId, { name: string; hint: string }> = {
  STANDARD: { name: "Standard", hint: "List with folder tree" },
  STRICT: { name: "Strict", hint: "Compact list, no tree" },
  MODERN: { name: "Modern", hint: "Split header with banner" },
  NOTION: { name: "Notion", hint: "Cover image and grid" },
};

export function DataroomLayoutPresetCards({
  selectedPreset,
  onSelect,
}: {
  selectedPreset: DataroomViewerLayoutPreset;
  onSelect: (id: DataroomLayoutCardId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {(Object.keys(DATAROOM_LAYOUT_PRESETS) as DataroomLayoutCardId[]).map(
        (id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              "rounded-md border border-gray-200 p-3 text-left text-xs dark:border-gray-700",
              selectedPreset === id &&
                "border-black bg-gray-50 dark:border-white dark:bg-gray-900",
            )}
          >
            <div className="font-medium">{LABELS[id].name}</div>
            <div className="text-muted-foreground">{LABELS[id].hint}</div>
          </button>
        ),
      )}
    </div>
  );
}
