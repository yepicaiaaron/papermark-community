import { GetServerSideProps } from "next";
import Head from "next/head";

import { useState } from "react";

import { findClient, normaliseScope } from "@/community/features/oauth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

/**
 * Community edition consent screen for apps connecting over MCP
 * (claude.ai, ChatGPT, Cursor and so on).
 */
type Props =
  | { error: string }
  | {
      error: null;
      clientName: string;
      clientUri: string | null;
      redirectHost: string;
      scope: string;
      teams: { id: string; name: string }[];
      userEmail: string | null;
      params: Record<string, string>;
    };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const q = ctx.query as Record<string, string | undefined>;
  const client = await findClient(q.client_id);
  if (!client) return { props: { error: "This app is not registered." } };
  if (!q.redirect_uri || !client.redirectUris.includes(q.redirect_uri)) {
    return { props: { error: "The app's return address does not match." } };
  }
  if (q.response_type !== "code") {
    return { props: { error: "Unsupported response_type." } };
  }
  if (!q.code_challenge || (q.code_challenge_method ?? "S256") !== "S256") {
    return { props: { error: "The app must use PKCE (S256)." } };
  }

  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  const user = session.user as CustomUser;
  const memberships = await prisma.userTeam.findMany({
    where: { userId: user.id },
    select: { team: { select: { id: true, name: true } } },
    orderBy: { team: { createdAt: "asc" } },
  });

  return {
    props: {
      error: null,
      clientName: client.clientName,
      clientUri: client.clientUri,
      redirectHost: new URL(q.redirect_uri).host,
      scope: normaliseScope(q.scope),
      teams: memberships.map((m) => m.team),
      userEmail: user.email ?? null,
      params: {
        client_id: q.client_id!,
        redirect_uri: q.redirect_uri,
        state: q.state ?? "",
        code_challenge: q.code_challenge,
        code_challenge_method: q.code_challenge_method ?? "S256",
        scope: q.scope ?? "",
      },
    },
  };
};

export default function Authorize(props: Props) {
  if (props.error !== null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-lg font-semibold">Can&apos;t connect</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {props.error}
          </p>
        </div>
      </main>
    );
  }
  return <Consent {...props} />;
}

function Consent(props: Extract<Props, { error: null }>) {
  const [teamId, setTeamId] = useState(props.teams[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function decide(decision: "allow" | "deny") {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/oauth/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...props.params, teamId, decision }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.redirectTo) {
      window.location.href = data.redirectTo;
      return;
    }
    setBusy(false);
    setMessage(data.error ?? "Something went wrong. Please try again.");
  }

  return (
    <>
      <Head>
        <title>Connect an app</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {
            <>
              <h1 className="text-lg font-semibold">
                {props.clientName} wants to use your documents
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Signed in as {props.userEmail}. It will be able to{" "}
                {props.scope === "apis.read"
                  ? "see your documents, links and viewer analytics"
                  : "see and upload documents, create and change share links, and see viewer analytics"}{" "}
                in the workspace you choose. You&apos;ll go back to{" "}
                <span className="font-medium">{props.redirectHost}</span>.
              </p>

              {props.teams.length === 0 ? (
                <p className="mt-6 text-sm">
                  You are not in any workspace yet. Create one first.
                </p>
              ) : (
                <label className="mt-6 block text-sm font-medium">
                  Workspace
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                  >
                    {props.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {message ? (
                <p className="mt-4 text-sm text-red-600">{message}</p>
              ) : null}

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide("deny")}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy || !teamId}
                  onClick={() => decide("allow")}
                  className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900"
                >
                  Allow
                </button>
              </div>
            </>
          }
        </div>
      </main>
    </>
  );
}
