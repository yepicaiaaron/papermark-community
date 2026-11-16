import type { ComponentProps } from "react";

import LinkSheet from "@/components/links/link-sheet";

/** Per-file permissions on a data room link: view and download. */
export type ItemPermission = Record<
  string,
  {
    view: boolean;
    download: boolean;
    itemType?: "DATAROOM_DOCUMENT" | "DATAROOM_FOLDER";
  }
>;

type Props = Omit<ComponentProps<typeof LinkSheet>, "setIsOpen" | "linkType"> & {
  setIsOpen: (open: boolean) => void;
  linkType: string;
  /** Upstream could open straight to a file permissions view; not used here. */
  initialView?: string;
};

/**
 * Share sheet for data room links. Uses the standard link sheet, which
 * already handles data room links, groups and all link options. Per-file
 * access is managed through data room groups.
 */
export function DataroomLinkSheet({ initialView: _initialView, ...props }: Props) {
  return (
    <LinkSheet
      {...(props as unknown as ComponentProps<typeof LinkSheet>)}
    />
  );
}
