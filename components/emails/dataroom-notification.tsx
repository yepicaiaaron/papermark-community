import React from "react";

import { Link } from "react-email";

import BrandEmail, { BrandButton, CopyLink, P } from "./shared/brand-email";

export default function DataroomNotification({
  dataroomName = "Example data room",
  documentName = "Example document",
  senderEmail,
  url = "https://example.com/view/123",
  unsubscribeUrl = "https://example.com/unsubscribe",
}: {
  dataroomName: string;
  documentName: string | undefined;
  senderEmail: string | null;
  url: string;
  unsubscribeUrl: string;
}) {
  return (
    <BrandEmail
      preview={`New document in ${dataroomName}`}
      title={`New document in ${dataroomName}`}
      note={
        <>
          You&apos;re getting this email
          {senderEmail ? (
            <>
              {" "}
              from <span className="text-black">{senderEmail}</span>
            </>
          ) : null}{" "}
          because you opened the data room {dataroomName}.{" "}
          <Link href={unsubscribeUrl} className="text-neutral-500 underline">
            Change your email settings
          </Link>
          .
        </>
      }
    >
      <P>
        <strong>{documentName ?? "A new document"}</strong> has been added to{" "}
        <strong>{dataroomName}</strong>.
      </P>
      <BrandButton href={url}>Open the data room</BrandButton>
      <CopyLink url={url} />
    </BrandEmail>
  );
}
