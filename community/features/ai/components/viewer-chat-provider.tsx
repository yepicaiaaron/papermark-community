import type { ReactNode } from "react";

/** AI chat is not part of the community edition. */
export function ViewerChatProvider({
  children,
}: {
  children?: ReactNode;
  [key: string]: any;
}) {
  return <>{children}</>;
}

export function ViewerChatLayout({
  children,
}: {
  children?: ReactNode;
  [key: string]: any;
}) {
  return <>{children}</>;
}

export function useViewerChatSafe(): {
  isOpen: boolean;
  isEnabled: boolean;
} | null {
  return null;
}
