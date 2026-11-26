import React from "react";

import { appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

export default function SlackIntegrationNotification({
  email = "user@example.com",
  team = {
    name: "Acme",
  },
  integration = {
    name: "Slack",
    slug: "slack",
  },
}: {
  email: string;
  team: {
    name: string;
  };
  integration: {
    name: string;
    slug: string;
  };
}) {
  return (
    <BrandEmail
      preview={`${integration.name} was added to ${team.name}`}
      title={`${integration.name} was added to your workspace`}
      note={
        <>
          This email was meant for <span className="text-black">{email}</span>.
          If you weren&apos;t expecting it, check your workspace settings.
        </>
      }
    >
      <P>
        The <strong>{integration.name}</strong> integration was added to{" "}
        <strong>{team.name}</strong>. You&apos;ll now get alerts about views,
        data room visits and downloads there.
      </P>
      <BrandButton href={appUrl(`/settings/integrations/${integration.slug}`)}>
        See the integration
      </BrandButton>
    </BrandEmail>
  );
}
