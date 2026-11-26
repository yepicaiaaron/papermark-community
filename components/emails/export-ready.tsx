import React from "react";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

export default function ExportReady({
  resourceName = "Export",
  downloadUrl = "https://example.com",
  email = "email@example.com",
}: {
  resourceName?: string;
  downloadUrl: string;
  email: string;
}) {
  return (
    <BrandEmail
      preview={`Your ${resourceName} export is ready`}
      title="Your export is ready"
      note={
        <>
          This email was meant for <span className="text-black">{email}</span>.
        </>
      }
    >
      <P>
        Your export of <strong>{resourceName}</strong> is ready to download.
      </P>
      <BrandButton href={downloadUrl}>Download the export</BrandButton>
    </BrandEmail>
  );
}
