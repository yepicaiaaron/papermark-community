import React from "react";

import { Hr, Link, Section, Text } from "react-email";

import { BRAND } from "@/community/brand/config";

/**
 * Community edition footer: brand name and site only. No Papermark name,
 * postal address or unsubscribe link into papermark.com.
 */
export const Footer = ({
  footerText,
}: {
  withAddress?: boolean;
  marketing?: boolean;
  footerText?: string | React.ReactNode;
}) => {
  const site = BRAND.url && BRAND.url !== "/" ? BRAND.url : BRAND.appUrl;
  return (
    <>
      <Hr />
      <Section className="text-gray-400">
        {footerText ? <Text className="text-xs">{footerText}</Text> : null}
        <Text className="text-xs">
          Sent by {BRAND.name} ·{" "}
          <Link href={site} className="text-gray-500 underline">
            {site.replace(/^https?:\/\//, "")}
          </Link>
        </Text>
      </Section>
    </>
  );
};
