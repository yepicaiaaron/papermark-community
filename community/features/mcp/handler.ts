import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { authenticateMcpRequest } from "./auth";
import { createMcpServer } from "./server";

/**
 * Remote MCP endpoint (Streamable HTTP, stateless). Community edition.
 *
 * Unauthenticated calls get a 401 that points at the OAuth metadata, which
 * is how claude.ai and other hosted clients discover the sign-in flow.
 */
function baseUrl(req: Request) {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin
  );
}

function unauthorized(req: Request) {
  const resourceMetadata = `${baseUrl(req)}/.well-known/oauth-protected-resource`;
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata}"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "WWW-Authenticate",
      },
    },
  );
}

export async function handleMcp(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version",
        "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
      },
    });
  }

  const auth = await authenticateMcpRequest(req);
  if (!auth) return unauthorized(req);

  // Stateless: no server-held sessions, so GET (server-sent stream) and
  // DELETE (end session) are not used.
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null,
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "POST" },
      },
    );
  }

  const server = createMcpServer(auth);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(req);
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(response.body, { status: response.status, headers });
  } finally {
    // Response bodies are fully buffered in JSON mode, so it is safe to close.
    void transport.close().catch(() => {});
    void server.close().catch(() => {});
  }
}
