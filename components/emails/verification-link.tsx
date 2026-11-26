import React from "react";

import { BRAND } from "@/community/brand/config";

import BrandEmail, { Code, P } from "./shared/brand-email";

const VerificationCodeEmail = ({
  email = "user@example.com",
  code = "45PFSNUDYW",
}: {
  email?: string;
  code?: string;
}) => {
  return (
    <BrandEmail
      preview={`Your ${BRAND.name} login code`}
      title="Your login code"
      note={
        <>
          This email was meant for <span className="text-black">{email}</span>.
          If you didn&apos;t ask for this code, you can ignore it.
        </>
      }
    >
      <P>Use this code to log in to {BRAND.name}:</P>
      <Code code={code} />
      <P>The code runs out in 15 minutes.</P>
    </BrandEmail>
  );
};

export default VerificationCodeEmail;
