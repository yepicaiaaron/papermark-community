import { JSXElementConstructor, ReactElement } from "react";

import { render, toPlainText } from "react-email";
import { Resend } from "resend";

import prisma from "@/lib/prisma";
import { log, nanoid } from "@/lib/utils";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Sender for all email in the community edition, e.g.
 * "StoryMachine <docs@storymachine.ai>". Must be a sender verified with
 * your email provider.
 */
const DEFAULT_FROM = process.env.EMAIL_FROM ?? "Papermark <noreply@example.com>";

const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;

/**
 * Upstream sends its own product and sales emails from papermark.com
 * addresses (trial nudges, check-ins, year in review). A self-hosted copy
 * can't send from that domain and shouldn't send those emails at all.
 */
const isUpstreamMarketing = (from?: string, marketing?: boolean) =>
  marketing || (!!from && PAPERMARK_ADDRESS.test(from));

/** Any papermark.com / papermark.io address, with or without a display name. */
const PAPERMARK_ADDRESS = /@(?:[a-z0-9-]+\.)*papermark\.(?:com|io)\b/i;

const addresses = (value?: string | string[]) =>
  (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);

async function sendWithPostmark({
  from,
  to,
  cc,
  replyTo,
  subject,
  html,
  text,
  headers,
}: {
  from: string;
  to: string;
  cc?: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}) {
  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": postmarkToken as string,
    },
    body: JSON.stringify({
      From: from,
      To: to,
      Cc: Array.isArray(cc) ? cc.join(",") || undefined : cc,
      ReplyTo: replyTo,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM ?? "outbound",
      Headers: Object.entries(headers).map(([Name, Value]) => ({ Name, Value })),
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    ErrorCode?: number;
    Message?: string;
    MessageID?: string;
  };
  if (!response.ok || (data.ErrorCode && data.ErrorCode !== 0)) {
    throw new Error(
      `Postmark error ${data.ErrorCode ?? response.status}: ${data.Message ?? "unknown"}`,
    );
  }
  return { id: data.MessageID ?? "" };
}

export const sendEmail = async ({
  to,
  subject,
  react,
  from,
  marketing,
  system: _system,
  verify: _verify,
  test,
  cc,
  replyTo,
  scheduledAt,
  unsubscribeUrl,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  react: ReactElement<any, string | JSXElementConstructor<any>>;
  from?: string;
  marketing?: boolean;
  system?: boolean;
  verify?: boolean;
  test?: boolean;
  cc?: string | string[];
  replyTo?: string;
  scheduledAt?: string;
  unsubscribeUrl?: string;
  idempotencyKey?: string;
}) => {
  if (isUpstreamMarketing(from, marketing)) {
    return null;
  }

  // Never send to, copy in or route replies to Papermark. Upstream code has
  // papermark.com addresses in a few places; none of them belong here.
  if (PAPERMARK_ADDRESS.test(to)) return null;
  cc = addresses(cc).filter((a) => !PAPERMARK_ADDRESS.test(a));
  if (replyTo && PAPERMARK_ADDRESS.test(replyTo)) replyTo = undefined;

  if (!resend && !postmarkToken) {
    throw new Error(
      "No email provider configured: set POSTMARK_SERVER_TOKEN or RESEND_API_KEY",
    );
  }

  const html = await render(react);
  const plainText = toPlainText(html);
  const fromAddress = from ?? DEFAULT_FROM;
  const headers: Record<string, string> = {
    // Reusing an idempotency key with a changed payload is a 409, so the
    // ref id has to come from the key rather than a fresh nanoid.
    "X-Entity-Ref-ID": idempotencyKey ?? nanoid(),
    ...(unsubscribeUrl
      ? {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }
      : {}),
  };

  try {
    if (postmarkToken) {
      // Postmark has no scheduled sending; scheduled emails are upstream
      // marketing follow-ups, so they are skipped rather than sent early.
      if (scheduledAt) return null;
      return await sendWithPostmark({
        from: fromAddress,
        to,
        cc,
        replyTo,
        subject,
        html,
        text: plainText,
        headers,
      });
    }

    const { data, error } = await resend!.emails.send(
      {
        from: fromAddress,
        to: test ? "delivered@resend.dev" : to,
        cc: cc,
        replyTo,
        subject,
        react,
        scheduledAt,
        text: plainText,
        headers,
      },
      { idempotencyKey },
    );

    // Check if the email sending operation returned an error and throw it
    if (error) {
      log({
        message: `Resend returned error when sending email: ${error.name} \n\n ${error.message}`,
        type: "error",
        mention: true,
      });
      throw error;
    }

    return data;
  } catch (exception) {
    log({
      message: `Unexpected error when sending email: ${exception}`,
      type: "error",
      mention: true,
    });
    throw exception;
  }
};

export const subscribe = async (email: string): Promise<void> => {
  if (!resend) {
    console.error("RESEND_API_KEY is not set in the .env. Skipping.");
    return;
  }

  const { data, error } = await resend.contacts.create({
    email,
  });

  if (error || !data?.id) {
    console.error("Failed to create contact:", error);
    return;
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.RESEND_MARKETING_SEGMENT_ID
  ) {
    await resend.contacts.segments.add({
      contactId: data.id,
      segmentId: process.env.RESEND_MARKETING_SEGMENT_ID as string,
    });
  }
};

export const unsubscribe = async (email: string): Promise<void> => {
  if (!resend) {
    console.error("RESEND_API_KEY is not set in the .env. Skipping.");
    return;
  }

  if (!email) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });

  if (!user || !user.email) {
    return;
  }

  await resend.contacts.update({
    email: user.email,
    unsubscribed: true,
  });
};
