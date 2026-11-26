import React from "react";

import type { ResolvedBrandLogo } from "@/community/features/branding/lib/brand-logo";

import BrandEmail, { Code, P } from "./shared/brand-email";

export default function OtpEmailVerification({
  email = "test@example.co",
  code = "123456",
  isDataroom = false,
  logo,
}: {
  email: string;
  code: string;
  isDataroom: boolean;
  logo?: ResolvedBrandLogo;
}) {
  const what = isDataroom ? "data room" : "document";
  return (
    <BrandEmail
      preview={`${code} is your verification code`}
      title="Your verification code"
      logoSrc={logo?.kind === "custom" ? logo.src : undefined}
      note={
        <>
          This email was meant for <span className="text-black">{email}</span>.
          If you didn&apos;t ask for this code, you can ignore it.
        </>
      }
    >
      <P>Use this code to open the {what} that was shared with you:</P>
      <Code code={code} />
      <P>The code runs out in 10 minutes.</P>
    </BrandEmail>
  );
}
