import React from "react";

import BrandEmail, { P } from "./shared/brand-email";

export default function ViewedDataroomPausedEmail({
  dataroomName = "Example data room",
  linkName = "Example link",
}: {
  dataroomName?: string;
  linkName?: string;
}) {
  return (
    <BrandEmail
      preview={`Someone opened ${dataroomName}`}
      title="Someone opened your data room"
    >
      <P>
        Someone opened <strong>{dataroomName}</strong> using the link{" "}
        <strong>{linkName}</strong>.
      </P>
      <P>
        Your workspace is paused, so the details of this visit aren&apos;t
        available. Ask your workspace admin to switch it back on.
      </P>
    </BrandEmail>
  );
}
