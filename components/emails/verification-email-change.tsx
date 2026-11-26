import React from "react";

import { BRAND, appUrl } from "@/community/brand/config";

import BrandEmail, { BrandButton, CopyLink, P } from "./shared/brand-email";

interface ConfirmEmailChangeProps {
  email: string;
  newEmail: string;
  confirmUrl: string;
}

export function ConfirmEmailChange({
  email = "email@example.com",
  newEmail = "new@example.com",
  confirmUrl = appUrl(),
}: ConfirmEmailChangeProps) {
  return (
    <BrandEmail
      preview="Confirm your new email address"
      title="Confirm your new email address"
      note={
        <>
          This email was meant for <span className="text-black">{email}</span>.
          If you didn&apos;t ask for this change, you can ignore it.
        </>
      }
    >
      <P>
        Someone asked to change the email address on your {BRAND.name} account
        from <strong>{email}</strong> to <strong>{newEmail}</strong>.
      </P>
      <BrandButton href={confirmUrl}>Confirm the change</BrandButton>
      <CopyLink url={confirmUrl} />
    </BrandEmail>
  );
}

export default ConfirmEmailChange;
