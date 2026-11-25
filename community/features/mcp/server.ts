import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinkAudienceType } from "@prisma/client";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { PDFDocument } from "pdf-lib";
import { z } from "zod";

import { processDocument } from "@/lib/api/documents/process-document";
import { putFileServer } from "@/lib/files/put-file-server";
import prisma from "@/lib/prisma";
import {
  getTotalAvgPageDuration,
  getTotalDocumentDuration,
  getViewPageDuration,
  getViewUserAgent,
} from "@/lib/tinybird";
import { generateEncrpytedPassword } from "@/lib/utils";
import { getSupportedContentType } from "@/lib/utils/get-content-type";
import { constructLinkUrl } from "@/lib/utils/link-url";

import { type McpAuth, hasScope } from "./auth";

/**
 * Community edition MCP server. Every tool works inside the caller's team
 * only (the team the API key or OAuth grant belongs to).
 */

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

const ok = (data: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});
const fail = (message: string): ToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

const seconds = (ms: number) => Math.round(ms / 100) / 10;

function guard(auth: McpAuth, scope: string, run: () => Promise<ToolResult>) {
  if (!hasScope(auth, scope)) {
    return Promise.resolve(
      fail(`This key does not have the "${scope}" permission.`),
    );
  }
  return run().catch((error: unknown) => {
    console.error("[mcp] tool error", error);
    return fail(error instanceof Error ? error.message : "Something went wrong");
  });
}

function isPrivateAddress(address: string) {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    return (
      a === "::1" ||
      a.startsWith("fc") ||
      a.startsWith("fd") ||
      a.startsWith("fe80") ||
      a.startsWith("::ffff:127.") ||
      a.startsWith("::ffff:10.") ||
      a.startsWith("::ffff:192.168.")
    );
  }
  const [a, b] = address.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

async function fetchPublicFile(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http and https links can be uploaded.");
  }
  const { address } = await lookup(url.hostname);
  if (isPrivateAddress(address)) {
    throw new Error("That address is not reachable from here.");
  }
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Could not download the file (HTTP ${response.status}).`);
  }
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES) {
    throw new Error("Files over 50 MB can't be uploaded this way.");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Files over 50 MB can't be uploaded this way.");
  }
  const contentType =
    response.headers.get("content-type")?.split(";")[0].trim() ||
    "application/octet-stream";
  return { buffer, contentType, url };
}

function fileNameFrom(url: URL, contentType: string) {
  const last = decodeURIComponent(url.pathname.split("/").pop() || "");
  if (last && last.includes(".")) return last;
  return contentType === "application/pdf" ? `${last || "document"}.pdf` : last;
}

async function resolveLinkDomain(
  teamId: string,
  domain: string | undefined,
  slug: string | undefined,
) {
  const domainRow = domain
    ? await prisma.domain.findUnique({ where: { slug: domain } })
    : await prisma.domain.findFirst({
        where: { teamId, isDefault: true, verified: true },
      });

  if (domain && (!domainRow || domainRow.teamId !== teamId)) {
    throw new Error(`The domain ${domain} is not set up for this workspace.`);
  }
  if (!domainRow) return { domainRow: null, slug: null };

  const finalSlug =
    slug?.trim() ||
    Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 4);
  const clash = await prisma.link.findUnique({
    where: {
      domainSlug_slug: { domainSlug: domainRow.slug, slug: finalSlug },
    },
  });
  if (clash) throw new Error(`${domainRow.slug}/${finalSlug} is already taken.`);
  return { domainRow, slug: finalSlug };
}

const linkSummary = (link: {
  id: string;
  name: string | null;
  domainId: string | null;
  domainSlug: string | null;
  slug: string | null;
  emailProtected: boolean;
  emailAuthenticated: boolean;
  password: string | null;
  allowDownload: boolean | null;
  expiresAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  _count?: { views: number };
}) => ({
  id: link.id,
  name: link.name,
  url: constructLinkUrl(link),
  requiresEmail: link.emailProtected,
  verifiesEmail: link.emailAuthenticated,
  hasPassword: Boolean(link.password),
  allowDownload: Boolean(link.allowDownload),
  expiresAt: link.expiresAt,
  archived: link.isArchived,
  createdAt: link.createdAt,
  views: link._count?.views,
});

const linkSelect = {
  id: true,
  name: true,
  domainId: true,
  domainSlug: true,
  slug: true,
  emailProtected: true,
  emailAuthenticated: true,
  password: true,
  allowDownload: true,
  expiresAt: true,
  isArchived: true,
  createdAt: true,
  _count: { select: { views: true } },
} as const;

export function createMcpServer(auth: McpAuth) {
  const server = new McpServer(
    { name: "papermark-community", version: "1.0.0" },
    {
      instructions:
        "Papermark document sharing. Upload decks and documents, create tracked share links, and see who viewed what, for how long and which pages. All tools act on the workspace the key belongs to. Durations are in seconds.",
    },
  );
  const teamId = auth.teamId;

  server.registerTool(
    "get_workspace",
    {
      title: "Workspace details",
      description:
        "The workspace this connection belongs to, with its share-link domains and counts of documents, links and views.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    () =>
      guard(auth, "documents.read", async () => {
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: {
            id: true,
            name: true,
            domains: {
              select: { slug: true, verified: true, isDefault: true },
            },
            _count: { select: { documents: true, links: true, views: true } },
          },
        });
        return ok(team);
      }),
  );

  server.registerTool(
    "list_documents",
    {
      title: "List documents",
      description:
        "Documents in the workspace, newest first, with link and view counts. Optionally filter by name.",
      inputSchema: {
        query: z.string().optional().describe("Text to match in the name"),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    ({ query, limit }) =>
      guard(auth, "documents.read", async () => {
        const documents = await prisma.document.findMany({
          where: {
            teamId,
            ...(query && { name: { contains: query, mode: "insensitive" } }),
          },
          orderBy: { createdAt: "desc" },
          take: limit ?? 25,
          select: {
            id: true,
            name: true,
            type: true,
            numPages: true,
            createdAt: true,
            _count: { select: { links: true, views: true } },
          },
        });
        return ok(
          documents.map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            pages: d.numPages,
            createdAt: d.createdAt,
            links: d._count.links,
            views: d._count.views,
          })),
        );
      }),
  );

  server.registerTool(
    "get_document",
    {
      title: "Get a document",
      description:
        "One document with its versions, share links (with URLs) and the 10 most recent views.",
      inputSchema: { documentId: z.string() },
      annotations: { readOnlyHint: true },
    },
    ({ documentId }) =>
      guard(auth, "documents.read", async () => {
        const doc = await prisma.document.findFirst({
          where: { id: documentId, teamId },
          select: {
            id: true,
            name: true,
            type: true,
            numPages: true,
            createdAt: true,
            versions: {
              orderBy: { versionNumber: "desc" },
              select: {
                versionNumber: true,
                numPages: true,
                isPrimary: true,
                createdAt: true,
              },
            },
            links: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              select: linkSelect,
            },
            views: {
              orderBy: { viewedAt: "desc" },
              take: 10,
              select: {
                id: true,
                viewerEmail: true,
                viewerName: true,
                viewedAt: true,
                linkId: true,
                downloadedAt: true,
              },
            },
          },
        });
        if (!doc) return fail("Document not found in this workspace.");
        return ok({ ...doc, links: doc.links.map(linkSummary) });
      }),
  );

  server.registerTool(
    "upload_document_from_url",
    {
      title: "Upload a document from a link",
      description:
        "Downloads a file from a public URL (PDF, Word, PowerPoint, Excel, images; up to 50 MB) and adds it to the workspace. Optionally creates a share link straight away.",
      inputSchema: {
        url: z.string().url(),
        name: z.string().optional().describe("Name to show; defaults to the file name"),
        createLink: z.boolean().optional().describe("Also create a share link"),
      },
    },
    ({ url, name, createLink }) =>
      guard(auth, "documents.write", async () => {
        const file = await fetchPublicFile(url);
        const supported = getSupportedContentType(file.contentType);
        if (!supported) {
          return fail(`Files of type ${file.contentType} are not supported.`);
        }
        const fileName = name?.trim() || fileNameFrom(file.url, file.contentType);

        let numPages = 1;
        if (supported === "pdf") {
          const pdf = await PDFDocument.load(file.buffer, {
            ignoreEncryption: true,
          });
          numPages = pdf.getPageCount();
        }

        const { type: storageType, data: key } = await putFileServer({
          file: { name: fileName, type: file.contentType, buffer: file.buffer },
          teamId,
        });
        if (!key || !storageType) throw new Error("Upload to storage failed.");

        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { plan: true },
        });

        const document = await processDocument({
          documentData: {
            name: fileName,
            key,
            storageType,
            numPages,
            supportedFileType: supported,
            contentType: file.contentType,
            fileSize: file.buffer.byteLength,
          },
          teamId,
          userId: auth.userId,
          teamPlan: team?.plan ?? "free",
          createLink: Boolean(createLink),
        });

        const links = await prisma.link.findMany({
          where: { documentId: document.id },
          select: linkSelect,
        });
        return ok({
          id: document.id,
          name: document.name,
          pages: numPages,
          links: links.map(linkSummary),
        });
      }),
  );

  server.registerTool(
    "create_link",
    {
      title: "Create a share link",
      description:
        "Creates a tracked share link for a document or data room. By default viewers must enter their email (and on installs that require it, confirm it with an emailed code), downloads are off, and you get notified of views. If the workspace has a default domain (for example docs.bigscreenhack.com) the link uses it.",
      inputSchema: {
        documentId: z.string().optional(),
        dataroomId: z.string().optional(),
        name: z.string().optional().describe("Internal name, e.g. the investor's name"),
        requireEmail: z.boolean().optional(),
        verifyEmail: z
          .boolean()
          .optional()
          .describe("Send viewers a code to prove the email is theirs"),
        allowList: z
          .array(z.string())
          .optional()
          .describe("Only these emails or @domains may view"),
        password: z.string().optional(),
        expiresAt: z.string().datetime().optional(),
        allowDownload: z.boolean().optional(),
        notifyOnView: z.boolean().optional(),
        domain: z.string().optional().describe("Custom domain to use"),
        slug: z.string().optional().describe("Path on the custom domain"),
      },
    },
    (input) =>
      guard(auth, "links.write", async () => {
        if (!input.documentId === !input.dataroomId) {
          return fail("Give either documentId or dataroomId.");
        }
        if (input.documentId) {
          const doc = await prisma.document.findFirst({
            where: { id: input.documentId, teamId },
            select: { id: true },
          });
          if (!doc) return fail("Document not found in this workspace.");
        } else {
          const room = await prisma.dataroom.findFirst({
            where: { id: input.dataroomId, teamId },
            select: { id: true },
          });
          if (!room) return fail("Data room not found in this workspace.");
        }

        const { domainRow, slug } = await resolveLinkDomain(
          teamId,
          input.domain,
          input.slug,
        );
        const allowList = input.allowList ?? [];

        const link = await prisma.link.create({
          data: {
            documentId: input.documentId ?? null,
            dataroomId: input.dataroomId ?? null,
            linkType: input.documentId ? "DOCUMENT_LINK" : "DATAROOM_LINK",
            teamId,
            ownerId: auth.userId,
            name: input.name ?? null,
            emailProtected:
              input.requireEmail ?? true ? true : allowList.length > 0,
            emailAuthenticated:
              input.verifyEmail ??
              process.env.NEXT_PUBLIC_DEFAULT_VERIFY_EMAIL === "true",
            allowList,
            password: input.password
              ? await generateEncrpytedPassword(input.password)
              : null,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            allowDownload: input.allowDownload ?? false,
            enableNotification: input.notifyOnView ?? true,
            domainId: domainRow?.id ?? null,
            domainSlug: domainRow?.slug ?? null,
            slug,
            audienceType: LinkAudienceType.GENERAL,
          },
          select: linkSelect,
        });
        return ok(linkSummary(link));
      }),
  );

  server.registerTool(
    "list_links",
    {
      title: "List share links",
      description: "Share links in the workspace, optionally for one document.",
      inputSchema: {
        documentId: z.string().optional(),
        includeArchived: z.boolean().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    ({ documentId, includeArchived, limit }) =>
      guard(auth, "links.read", async () => {
        const links = await prisma.link.findMany({
          where: {
            teamId,
            deletedAt: null,
            ...(documentId && { documentId }),
            ...(!includeArchived && { isArchived: false }),
          },
          orderBy: { createdAt: "desc" },
          take: limit ?? 50,
          select: {
            ...linkSelect,
            document: { select: { id: true, name: true } },
            dataroom: { select: { id: true, name: true } },
          },
        });
        return ok(
          links.map((l) => ({
            ...linkSummary(l),
            document: l.document,
            dataroom: l.dataroom,
          })),
        );
      }),
  );

  server.registerTool(
    "update_link",
    {
      title: "Update a share link",
      description:
        "Change a link's name, password, expiry, download setting or email gate, or archive it to stop access.",
      inputSchema: {
        linkId: z.string(),
        name: z.string().optional(),
        password: z
          .string()
          .nullable()
          .optional()
          .describe("New password, or null to remove it"),
        expiresAt: z.string().datetime().nullable().optional(),
        allowDownload: z.boolean().optional(),
        requireEmail: z.boolean().optional(),
        verifyEmail: z.boolean().optional(),
        archived: z.boolean().optional(),
      },
    },
    (input) =>
      guard(auth, "links.write", async () => {
        const existing = await prisma.link.findFirst({
          where: { id: input.linkId, teamId, deletedAt: null },
          select: { id: true },
        });
        if (!existing) return fail("Link not found in this workspace.");
        const link = await prisma.link.update({
          where: { id: input.linkId },
          data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.password !== undefined && {
              password: input.password
                ? await generateEncrpytedPassword(input.password)
                : null,
            }),
            ...(input.expiresAt !== undefined && {
              expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            }),
            ...(input.allowDownload !== undefined && {
              allowDownload: input.allowDownload,
            }),
            ...(input.requireEmail !== undefined && {
              emailProtected: input.requireEmail,
            }),
            ...(input.verifyEmail !== undefined && {
              emailAuthenticated: input.verifyEmail,
            }),
            ...(input.archived !== undefined && { isArchived: input.archived }),
          },
          select: linkSelect,
        });
        return ok(linkSummary(link));
      }),
  );

  server.registerTool(
    "list_views",
    {
      title: "Recent views",
      description:
        "Who opened your documents, newest first, with how long they spent. Filter by document, link or viewer email.",
      inputSchema: {
        documentId: z.string().optional(),
        linkId: z.string().optional(),
        email: z.string().optional(),
        since: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    (input) =>
      guard(auth, "analytics.read", async () => {
        const views = await prisma.view.findMany({
          where: {
            teamId,
            isArchived: false,
            ...(input.documentId && { documentId: input.documentId }),
            ...(input.linkId && { linkId: input.linkId }),
            ...(input.email && {
              viewerEmail: { contains: input.email, mode: "insensitive" },
            }),
            ...(input.since && { viewedAt: { gte: new Date(input.since) } }),
          },
          orderBy: { viewedAt: "desc" },
          take: input.limit ?? 20,
          select: {
            id: true,
            viewerEmail: true,
            viewerName: true,
            viewedAt: true,
            downloadedAt: true,
            viewType: true,
            documentId: true,
            document: { select: { name: true, numPages: true } },
            dataroom: { select: { name: true } },
            link: { select: { id: true, name: true } },
          },
        });

        const withTime = await Promise.all(
          views.map(async (v) => {
            let totalSeconds: number | null = null;
            let pagesViewed: number | null = null;
            if (v.documentId) {
              const pages = await getViewPageDuration({
                documentId: v.documentId,
                viewId: v.id,
                since: 0,
              }).catch(() => null);
              if (pages) {
                totalSeconds = seconds(
                  pages.data.reduce((s, p) => s + p.sum_duration, 0),
                );
                pagesViewed = pages.data.length;
              }
            }
            return {
              viewId: v.id,
              email: v.viewerEmail,
              name: v.viewerName,
              viewedAt: v.viewedAt,
              downloaded: Boolean(v.downloadedAt),
              document: v.document?.name ?? null,
              dataroom: v.dataroom?.name ?? null,
              link: v.link,
              totalSeconds,
              pagesViewed,
              totalPages: v.document?.numPages ?? null,
            };
          }),
        );
        return ok(withTime);
      }),
  );

  server.registerTool(
    "get_view",
    {
      title: "One view in detail",
      description:
        "Page-by-page time for a single view, plus the viewer's location, browser and device.",
      inputSchema: { viewId: z.string() },
      annotations: { readOnlyHint: true },
    },
    ({ viewId }) =>
      guard(auth, "analytics.read", async () => {
        const view = await prisma.view.findFirst({
          where: { id: viewId, teamId },
          select: {
            id: true,
            viewerEmail: true,
            viewerName: true,
            viewedAt: true,
            downloadedAt: true,
            documentId: true,
            document: { select: { name: true, numPages: true } },
            link: { select: { id: true, name: true } },
          },
        });
        if (!view) return fail("View not found in this workspace.");
        const [pages, agent] = await Promise.all([
          view.documentId
            ? getViewPageDuration({
                documentId: view.documentId,
                viewId,
                since: 0,
              }).catch(() => null)
            : null,
          getViewUserAgent({ viewId }).catch(() => null),
        ]);
        const perPage = (pages?.data ?? [])
          .map((p) => ({
            page: Number(p.pageNumber),
            seconds: seconds(p.sum_duration),
          }))
          .sort((a, b) => a.page - b.page);
        return ok({
          viewId: view.id,
          email: view.viewerEmail,
          name: view.viewerName,
          viewedAt: view.viewedAt,
          downloaded: Boolean(view.downloadedAt),
          document: view.document?.name ?? null,
          totalPages: view.document?.numPages ?? null,
          link: view.link,
          totalSeconds: seconds(
            (pages?.data ?? []).reduce((s, p) => s + p.sum_duration, 0),
          ),
          pages: perPage,
          device: agent?.data?.[0] ?? null,
        });
      }),
  );

  server.registerTool(
    "get_document_analytics",
    {
      title: "Document analytics",
      description:
        "Totals for one document: views, unique viewers, total reading time, average time on each page, and the top viewers.",
      inputSchema: {
        documentId: z.string(),
        excludeEmails: z
          .array(z.string())
          .optional()
          .describe("Leave out views from these emails, e.g. your own"),
      },
      annotations: { readOnlyHint: true },
    },
    ({ documentId, excludeEmails }) =>
      guard(auth, "analytics.read", async () => {
        const doc = await prisma.document.findFirst({
          where: { id: documentId, teamId },
          select: { id: true, name: true, numPages: true },
        });
        if (!doc) return fail("Document not found in this workspace.");

        const views = await prisma.view.findMany({
          where: { documentId, teamId, isArchived: false },
          select: { id: true, viewerEmail: true, viewedAt: true },
          orderBy: { viewedAt: "desc" },
        });
        const excluded = new Set(
          (excludeEmails ?? []).map((e) => e.toLowerCase()),
        );
        const excludedIds = views
          .filter((v) => v.viewerEmail && excluded.has(v.viewerEmail.toLowerCase()))
          .map((v) => v.id);
        const kept = views.filter((v) => !excludedIds.includes(v.id));
        const excludedViewIds = excludedIds.join(",") || "none";

        const [total, avg] = await Promise.all([
          getTotalDocumentDuration({
            documentId,
            excludedLinkIds: "none",
            excludedViewIds,
            since: 0,
          }).catch(() => null),
          getTotalAvgPageDuration({
            documentId,
            excludedLinkIds: "none",
            excludedViewIds,
            since: 0,
          }).catch(() => null),
        ]);

        const byViewer = new Map<string, { views: number; lastViewed: Date }>();
        for (const v of kept) {
          const key = v.viewerEmail ?? "anonymous";
          const entry = byViewer.get(key);
          if (entry) entry.views += 1;
          else byViewer.set(key, { views: 1, lastViewed: v.viewedAt });
        }

        return ok({
          document: doc,
          views: kept.length,
          uniqueViewers: byViewer.size,
          totalSeconds: seconds(total?.data?.[0]?.sum_duration ?? 0),
          averageSecondsPerPage: (avg?.data ?? [])
            .map((p) => ({
              version: p.versionNumber,
              page: Number(p.pageNumber),
              seconds: seconds(p.avg_duration),
            }))
            .sort((a, b) => a.version - b.version || a.page - b.page),
          viewers: Array.from(byViewer.entries())
            .map(([email, v]) => ({ email, ...v }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 25),
        });
      }),
  );

  server.registerTool(
    "list_visitors",
    {
      title: "Visitors",
      description:
        "Everyone who has viewed anything in the workspace, with how many views and when they last looked.",
      inputSchema: {
        query: z.string().optional().describe("Text to match in the email"),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    ({ query, limit }) =>
      guard(auth, "visitors.read", async () => {
        const rows = await prisma.view.groupBy({
          by: ["viewerEmail"],
          where: {
            teamId,
            isArchived: false,
            viewerEmail: query
              ? { contains: query, mode: "insensitive" }
              : { not: null },
          },
          _count: { _all: true },
          _max: { viewedAt: true },
          orderBy: { _max: { viewedAt: "desc" } },
          take: limit ?? 50,
        });
        return ok(
          rows.map((r) => ({
            email: r.viewerEmail,
            views: r._count._all,
            lastViewed: r._max.viewedAt,
          })),
        );
      }),
  );

  server.registerTool(
    "list_datarooms",
    {
      title: "List data rooms",
      description: "Data rooms in the workspace with document and link counts.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    () =>
      guard(auth, "datarooms.read", async () => {
        const rooms = await prisma.dataroom.findMany({
          where: { teamId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: { select: { documents: true, links: true, views: true } },
          },
        });
        return ok(
          rooms.map((r) => ({
            id: r.id,
            name: r.name,
            createdAt: r.createdAt,
            documents: r._count.documents,
            links: r._count.links,
            views: r._count.views,
          })),
        );
      }),
  );

  server.registerTool(
    "add_document_to_dataroom",
    {
      title: "Add a document to a data room",
      description: "Puts an existing document into a data room (top level).",
      inputSchema: { documentId: z.string(), dataroomId: z.string() },
    },
    ({ documentId, dataroomId }) =>
      guard(auth, "datarooms.write", async () => {
        const [doc, room] = await Promise.all([
          prisma.document.findFirst({
            where: { id: documentId, teamId },
            select: { id: true },
          }),
          prisma.dataroom.findFirst({
            where: { id: dataroomId, teamId },
            select: { id: true },
          }),
        ]);
        if (!doc || !room) return fail("Document or data room not found.");
        const exists = await prisma.dataroomDocument.findFirst({
          where: { documentId, dataroomId },
          select: { id: true },
        });
        if (exists) return ok({ added: false, reason: "Already in the room" });
        await prisma.dataroomDocument.create({
          data: { documentId, dataroomId },
        });
        return ok({ added: true });
      }),
  );

  return server;
}
