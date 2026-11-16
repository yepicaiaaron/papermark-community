import {
  DefaultPermissionStrategy,
  ItemType,
  RootItemAccess,
} from "@prisma/client";

import prisma from "@/lib/prisma";

import { resolveRootItemAccessFlags } from "./root-item-access";

/**
 * Default access for documents added to a data room. Upstream Papermark
 * imports this file but does not publish it; this is an independent
 * implementation that follows the same rules the AGPL code uses for new
 * folders:
 *
 * - INHERIT_FROM_PARENT: copy the parent folder's access, or use the root
 *   item setting for documents at the top level.
 * - ASK_EVERY_TIME and HIDDEN_BY_DEFAULT: write nothing, which leaves the
 *   document hidden from restricted groups until someone grants access.
 */
type AttachedDocument = { id: string; folderId: string | null };

async function applyViewerGroups(
  dataroomId: string,
  docs: AttachedDocument[],
  strategy: DefaultPermissionStrategy,
  rootItemAccess: RootItemAccess,
) {
  if (strategy !== DefaultPermissionStrategy.INHERIT_FROM_PARENT) return;
  const groups = await prisma.viewerGroup.findMany({
    where: { dataroomId },
    select: { id: true },
  });
  if (groups.length === 0) return;

  const folderIds = [
    ...new Set(docs.map((d) => d.folderId).filter(Boolean)),
  ] as string[];
  const parentPerms = folderIds.length
    ? await prisma.viewerGroupAccessControls.findMany({
        where: {
          itemId: { in: folderIds },
          itemType: ItemType.DATAROOM_FOLDER,
        },
        select: {
          groupId: true,
          itemId: true,
          canView: true,
          canDownload: true,
        },
      })
    : [];
  const rootFlags = resolveRootItemAccessFlags(rootItemAccess);

  const rows = docs.flatMap((doc) => {
    if (doc.folderId) {
      return parentPerms
        .filter((p) => p.itemId === doc.folderId)
        .map((p) => ({
          groupId: p.groupId,
          itemId: doc.id,
          itemType: ItemType.DATAROOM_DOCUMENT,
          canView: p.canView,
          canDownload: p.canDownload,
        }));
    }
    if (!rootFlags) return [];
    return groups.map((g) => ({
      groupId: g.id,
      itemId: doc.id,
      itemType: ItemType.DATAROOM_DOCUMENT,
      ...rootFlags,
    }));
  });

  if (rows.length) {
    await prisma.viewerGroupAccessControls.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }
}

async function applyPermissionGroups(
  dataroomId: string,
  docs: AttachedDocument[],
  strategy: DefaultPermissionStrategy,
  rootItemAccess: RootItemAccess,
) {
  if (strategy !== DefaultPermissionStrategy.INHERIT_FROM_PARENT) return;
  const groups = await prisma.permissionGroup.findMany({
    where: { dataroomId },
    select: { id: true },
  });
  if (groups.length === 0) return;

  const folderIds = [
    ...new Set(docs.map((d) => d.folderId).filter(Boolean)),
  ] as string[];
  const parentPerms = folderIds.length
    ? await prisma.permissionGroupAccessControls.findMany({
        where: {
          itemId: { in: folderIds },
          itemType: ItemType.DATAROOM_FOLDER,
        },
        select: {
          groupId: true,
          itemId: true,
          canView: true,
          canDownload: true,
          canDownloadOriginal: true,
        },
      })
    : [];
  const rootFlags = resolveRootItemAccessFlags(rootItemAccess);

  const rows = docs.flatMap((doc) => {
    if (doc.folderId) {
      return parentPerms
        .filter((p) => p.itemId === doc.folderId)
        .map((p) => ({
          groupId: p.groupId,
          itemId: doc.id,
          itemType: ItemType.DATAROOM_DOCUMENT,
          canView: p.canView,
          canDownload: p.canDownload,
          canDownloadOriginal: p.canDownloadOriginal,
        }));
    }
    if (!rootFlags) return [];
    return groups.map((g) => ({
      groupId: g.id,
      itemId: doc.id,
      itemType: ItemType.DATAROOM_DOCUMENT,
      ...rootFlags,
      canDownloadOriginal: false,
    }));
  });

  if (rows.length) {
    await prisma.permissionGroupAccessControls.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }
}

export async function applyDataroomDocumentPermissionDefaults({
  dataroomId,
  dataroomDocuments,
  groupStrategy,
  groupRootItemAccess,
  linkStrategy,
  linkRootItemAccess,
}: {
  dataroomId: string;
  dataroomDocuments: AttachedDocument[];
  groupStrategy: DefaultPermissionStrategy;
  groupRootItemAccess: RootItemAccess;
  linkStrategy: DefaultPermissionStrategy;
  linkRootItemAccess: RootItemAccess;
}) {
  if (dataroomDocuments.length === 0) return;
  await Promise.all([
    applyViewerGroups(
      dataroomId,
      dataroomDocuments,
      groupStrategy,
      groupRootItemAccess,
    ),
    applyPermissionGroups(
      dataroomId,
      dataroomDocuments,
      linkStrategy,
      linkRootItemAccess,
    ),
  ]);
}

/**
 * Called after documents are attached to a data room. Applies the data
 * room's saved defaults; `schedule` lets the caller run it after the
 * response is sent.
 */
export async function onDataroomDocumentsAttached({
  dataroomId,
  dataroomDocuments,
  schedule,
}: {
  dataroomId: string;
  dataroomDocuments: AttachedDocument[];
  schedule?: (promise: Promise<unknown>) => void;
}) {
  const work = (async () => {
    const dataroom = await prisma.dataroom.findUnique({
      where: { id: dataroomId },
      select: {
        defaultPermissionStrategy: true,
        defaultGroupPermissionStrategy: true,
        defaultRootItemAccess: true,
        defaultGroupRootItemAccess: true,
      },
    });
    if (!dataroom) return;
    await applyDataroomDocumentPermissionDefaults({
      dataroomId,
      dataroomDocuments,
      groupStrategy: dataroom.defaultGroupPermissionStrategy,
      groupRootItemAccess: dataroom.defaultGroupRootItemAccess,
      linkStrategy: dataroom.defaultPermissionStrategy,
      linkRootItemAccess: dataroom.defaultRootItemAccess,
    });
  })();

  if (schedule) {
    schedule(work.catch((e) => console.error("Default permissions failed", e)));
    return;
  }
  await work;
}
