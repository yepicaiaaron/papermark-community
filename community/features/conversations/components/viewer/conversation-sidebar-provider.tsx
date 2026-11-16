import type { ReactNode } from "react";

/** Q&A is not part of the community edition. */
export function ConversationSidebarProvider({
  children,
}: {
  children?: ReactNode;
  [key: string]: any;
}) {
  return <>{children}</>;
}

export function ConversationSidebarLayout({
  children,
}: {
  children?: ReactNode;
  [key: string]: any;
}) {
  return <>{children}</>;
}

export function useConversationSidebarSafe(): { isOpen: boolean } | null {
  return null;
}
