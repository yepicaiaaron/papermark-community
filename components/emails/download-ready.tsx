import React from "react";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

function formatExpirationTime(expiresAt?: string): string {
  if (!expiresAt) return "3 days";
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  return "less than an hour";
}

export default function DownloadReady({
  dataroomName = "Data room",
  downloadUrl = "https://example.com",
  email = "email@example.com",
  expiresAt,
  isViewer = false,
}: {
  dataroomName?: string;
  downloadUrl?: string;
  email: string;
  expiresAt?: string;
  isViewer?: boolean;
}) {
  return (
    <BrandEmail
      preview={`Your ${dataroomName} download is ready`}
      title="Your download is ready"
      note={
        <>
          This email was meant for <span className="text-black">{email}</span>.
        </>
      }
    >
      <P>
        Your download of <strong>{dataroomName}</strong> is ready.{" "}
        {isViewer ? "" : "You'll need to be logged in to get it."}
      </P>
      <BrandButton href={downloadUrl}>Download the files</BrandButton>
      <P>The link runs out in {formatExpirationTime(expiresAt)}.</P>
    </BrandEmail>
  );
}
