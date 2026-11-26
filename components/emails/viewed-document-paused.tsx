import React from "react";

import BrandEmail, { P } from "./shared/brand-email";

export default function ViewedDocumentPausedEmail({
  documentName = "Example document",
  linkName = "Example link",
}: {
  documentName?: string;
  linkName?: string;
}) {
  return (
    <BrandEmail
      preview={`Someone opened ${documentName}`}
      title="Someone opened your document"
    >
      <P>
        Someone opened <strong>{documentName}</strong> using the link{" "}
        <strong>{linkName}</strong>.
      </P>
      <P>
        Your workspace is paused, so the details of this visit aren&apos;t
        available. Ask your workspace admin to switch it back on.
      </P>
    </BrandEmail>
  );
}
