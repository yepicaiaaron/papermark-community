import React from "react";

import { BRAND } from "@/community/brand/config";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

/**
 * Community edition: one layout for every email, in the app's own look
 * (white card, black buttons) with the brand from community/brand/config.
 * No Papermark name, address or links.
 */

const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export function BrandHeader({ logoSrc }: { logoSrc?: string }) {
  const src = logoSrc || BRAND.emailLogo;
  return (
    <Section className="mt-6">
      {src ? (
        <table cellPadding={0} cellSpacing={0} role="presentation">
          <tbody>
            <tr>
              <td style={{ verticalAlign: "middle" }}>
                <Img
                  src={src}
                  alt={BRAND.name}
                  height="32"
                  style={{ height: 32, width: "auto", display: "block" }}
                />
              </td>
              {logoSrc ? null : (
                <td style={{ verticalAlign: "middle", paddingLeft: 10 }}>
                  <Text className="m-0 text-xl font-bold tracking-tight text-black">
                    {BRAND.name}
                  </Text>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      ) : (
        <Text className="m-0 text-xl font-bold tracking-tight text-black">
          {BRAND.name}
        </Text>
      )}
    </Section>
  );
}

export function BrandButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section className="my-7">
      <Button
        className="rounded-md bg-black text-center text-sm font-semibold text-white no-underline"
        href={href}
        style={{ padding: "12px 22px" }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function CopyLink({ url }: { url: string }) {
  return (
    <Text className="text-xs leading-5 text-neutral-500">
      Or copy this link into your browser:
      <br />
      <Link href={url} className="break-all text-neutral-700 underline">
        {url}
      </Link>
    </Text>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm leading-6 text-neutral-700">{children}</Text>;
}

export function Code({ code }: { code: string }) {
  return (
    <Section className="my-6">
      <Text
        className="m-0 rounded-lg bg-neutral-100 px-4 py-3 text-center text-2xl font-semibold text-black"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          letterSpacing: "0.2em",
        }}
      >
        {code}
      </Text>
    </Section>
  );
}

export default function BrandEmail({
  preview,
  title,
  children,
  note,
  logoSrc,
}: {
  preview: string;
  title: string;
  children: React.ReactNode;
  /** Small print above the brand line, e.g. who the email was for. */
  note?: React.ReactNode;
  /** A workspace's own uploaded logo, used in place of the brand. */
  logoSrc?: string;
}) {
  const site = BRAND.url && BRAND.url !== "/" ? BRAND.url : BRAND.appUrl;
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-neutral-50 px-2 font-sans">
          <Container className="mx-auto my-10 max-w-[560px] rounded-lg border border-solid border-neutral-200 bg-white px-9 py-6">
            <BrandHeader logoSrc={logoSrc} />
            <Heading className="mx-0 mb-4 mt-7 p-0 text-xl font-semibold text-black">
              {title}
            </Heading>
            {children}
            <Hr className="my-6 border-neutral-200" />
            {note ? (
              <Text className="text-xs leading-5 text-neutral-500">{note}</Text>
            ) : null}
            <Text className="text-xs leading-5 text-neutral-400">
              Sent by {BRAND.name} ·{" "}
              <Link href={site} className="text-neutral-500 underline">
                {host(site)}
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
