import React from "react";

import { appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

export default function CustomDomainSetup({
  name = "there",
}: {
  name?: string;
  currentPlan?: string;
  hasAccess?: boolean;
}) {
  return (
    <BrandEmail preview="Set up your own domain" title="Set up your own domain">
      <P>Hi {name},</P>
      <P>
        You can share links on your own domain. Add it in settings, then add
        the DNS record shown there with your domain provider.
      </P>
      <BrandButton href={appUrl("/settings/domains")}>Add a domain</BrandButton>
    </BrandEmail>
  );
}
