import React from "react";

import { appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

export default function DomainDeleted({
  domain = "docs.example.com",
}: {
  domain: string;
}) {
  return (
    <BrandEmail preview={`${domain} has been removed`} title={`${domain} has been removed`}>
      <P>
        Your domain <strong>{domain}</strong> wasn&apos;t set up correctly for
        30 days, so it has been removed from your workspace.
      </P>
      <P>You can add it again at any time.</P>
      <BrandButton href={appUrl("/settings/domains")}>Add the domain again</BrandButton>
    </BrandEmail>
  );
}
