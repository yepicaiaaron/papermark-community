import React from "react";

import { BRAND, appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, CopyLink, P } from "./shared/brand-email";

export default function TeamInvitation({
  senderName,
  senderEmail,
  teamName,
  url = appUrl(),
}: {
  senderName: string;
  senderEmail: string;
  teamName: string;
  url: string;
}) {
  return (
    <BrandEmail
      preview={`${senderName} invited you to ${teamName}`}
      title={`Join ${teamName} on ${BRAND.name}`}
      note="If you weren't expecting this invitation, you can ignore this email."
    >
      <P>
        <strong>{senderName}</strong> ({senderEmail}) has invited you to the{" "}
        <strong>{teamName}</strong> workspace on {BRAND.name}.
      </P>
      <BrandButton href={url}>Join the workspace</BrandButton>
      <CopyLink url={url} />
    </BrandEmail>
  );
}
