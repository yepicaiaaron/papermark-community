import React from "react";

import { Link } from "react-email";

import BrandEmail, { BrandButton, CopyLink, P } from "./shared/brand-email";

type DocumentChange = {
  documentName: string;
};

export default function DataroomDigestNotification({
  dataroomName = "Example data room",
  documents = [
    { documentName: "Document A" },
    { documentName: "Document B" },
    { documentName: "Document C" },
  ],
  senderEmail,
  url = "https://example.com/view/123",
  preferencesUrl = "https://example.com/notification-preferences?token=abc",
  frequency = "daily",
}: {
  dataroomName: string;
  documents: DocumentChange[];
  senderEmail: string | null;
  url: string;
  preferencesUrl: string;
  frequency: "daily" | "weekly" | "instant";
}) {
  const count = documents.length;
  const periodLabel =
    frequency === "instant"
      ? "recently"
      : frequency === "daily"
        ? "today"
        : "this week";
  const title = `${count} new document${count !== 1 ? "s" : ""} in ${dataroomName}`;
  return (
    <BrandEmail
      preview={title}
      title={title}
      note={
        <>
          You&apos;re getting this{" "}
          {frequency === "instant" ? "email" : `${frequency} summary`}
          {senderEmail ? (
            <>
              {" "}
              from <span className="text-black">{senderEmail}</span>
            </>
          ) : null}{" "}
          because you opened the data room {dataroomName}.{" "}
          <Link href={preferencesUrl} className="text-neutral-500 underline">
            Change your email settings
          </Link>
          .
        </>
      }
    >
      <P>
        {count === 1 ? "This document was" : "These documents were"} added to{" "}
        <strong>{dataroomName}</strong> {periodLabel}:
      </P>
      {documents.map((doc, i) => (
        <P key={i}>• {doc.documentName}</P>
      ))}
      <BrandButton href={url}>Open the data room</BrandButton>
      <CopyLink url={url} />
    </BrandEmail>
  );
}
