import React from "react";

import { appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

export default function DataroomUploadNotification({
  dataroomId = "123",
  dataroomName = "Example data room",
  uploaderEmail = "visitor@example.com",
  documentNames = ["Document 1.pdf", "Document 2.pdf"],
  linkName = "Link #abc12",
}: {
  dataroomId: string;
  dataroomName: string;
  uploaderEmail: string | null;
  documentNames: string[];
  linkName: string;
}) {
  const count = documentNames.length;
  const files = `${count} file${count !== 1 ? "s" : ""}`;
  return (
    <BrandEmail
      preview={`${uploaderEmail ?? "A visitor"} uploaded ${files} to ${dataroomName}`}
      title="New files in your data room"
      note={
        <>
          To stop these emails for this link, edit the link and turn off
          &quot;Receive email notification&quot;.
        </>
      }
    >
      <P>
        <strong>{uploaderEmail ?? "A visitor"}</strong> uploaded{" "}
        <strong>{files}</strong> to <strong>{dataroomName}</strong>, using the
        link <strong>{linkName}</strong>.
      </P>
      {count <= 10 ? documentNames.map((name, i) => <P key={i}>• {name}</P>) : null}
      <BrandButton href={appUrl(`/datarooms/${dataroomId}`)}>
        Open the data room
      </BrandButton>
    </BrandEmail>
  );
}
