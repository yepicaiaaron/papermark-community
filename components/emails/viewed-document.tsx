import React from "react";

import { appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

export default function ViewedDocument({
  documentId = "123",
  documentName = "Pitch deck",
  linkName = "Pitch deck",
  viewerEmail,
  locationString,
}: {
  documentId: string;
  documentName: string;
  linkName: string;
  viewerEmail: string | null;
  locationString?: string;
}) {
  return (
    <BrandEmail
      preview={`${viewerEmail ?? "Someone"} just opened ${documentName}`}
      title="Someone opened your document"
      note={
        <>
          To stop these emails for this link, edit the link and turn off
          &quot;Receive email notification&quot;.
        </>
      }
    >
      <P>
        <strong>{viewerEmail ?? "Someone"}</strong> just opened{" "}
        <strong>{documentName}</strong>
        {locationString ? (
          <>
            {" "}
            from <strong>{locationString}</strong>
          </>
        ) : null}
        , using the link <strong>{linkName}</strong>.
      </P>
      <P>See how long they spent on each page.</P>
      <BrandButton href={appUrl(`/documents/${documentId}`)}>
        See the analytics
      </BrandButton>
    </BrandEmail>
  );
}
