import React from "react";

import { appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

export default function InvalidDomain({
  domain = "docs.example.com",
  invalidDays = 14,
}: {
  domain: string;
  invalidDays: number;
}) {
  return (
    <BrandEmail
      preview={`${domain} needs setting up`}
      title={`${domain} needs setting up`}
    >
      <P>
        Your domain <strong>{domain}</strong> hasn&apos;t been set up correctly
        for {invalidDays} days, so links on it won&apos;t open.
      </P>
      <P>
        If it isn&apos;t fixed within 30 days of first being added, it will be
        removed automatically. Check its DNS settings with the button below.
      </P>
      <BrandButton href={appUrl("/settings/domains")}>Check the domain</BrandButton>
    </BrandEmail>
  );
}
