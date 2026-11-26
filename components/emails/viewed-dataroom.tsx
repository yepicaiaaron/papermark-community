import React from "react";

import { appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, P } from "./shared/brand-email";

export default function ViewedDataroom({
  dataroomId = "123",
  dataroomName = "Example data room",
  linkName = "Data room",
  viewerEmail,
  locationString,
}: {
  dataroomId: string;
  dataroomName: string;
  linkName: string;
  viewerEmail: string | null;
  locationString?: string;
}) {
  return (
    <BrandEmail
      preview={`${viewerEmail ?? "Someone"} just opened ${dataroomName}`}
      title="Someone opened your data room"
      note={
        <>
          To stop these emails for this link, edit the link and turn off
          &quot;Receive email notification&quot;.
        </>
      }
    >
      <P>
        <strong>{viewerEmail ?? "Someone"}</strong> just opened{" "}
        <strong>{dataroomName}</strong>
        {locationString ? (
          <>
            {" "}
            from <strong>{locationString}</strong>
          </>
        ) : null}
        , using the link <strong>{linkName}</strong>.
      </P>
      <P>See which documents they opened and how long they spent on each.</P>
      <BrandButton href={appUrl(`/datarooms/${dataroomId}`)}>
        See the analytics
      </BrandButton>
    </BrandEmail>
  );
}
