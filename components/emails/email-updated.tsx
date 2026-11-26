import React from "react";

import { Link } from "react-email";

import { BRAND, appUrl } from "@/community/brand/config";

import BrandEmail, { P } from "./shared/brand-email";

export function EmailUpdated({
  oldEmail = "old@example.com",
  newEmail = "new@example.com",
}: {
  oldEmail: string;
  newEmail: string;
}) {
  return (
    <BrandEmail
      preview="Your email address has been changed"
      title="Your email address has been changed"
      note="We've only sent this to your old email address."
    >
      <P>
        The email address on your {BRAND.name} account has been changed from{" "}
        <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
      </P>
      <P>
        If you didn&apos;t make this change,{" "}
        <Link href={appUrl("/account/general")} className="text-black underline">
          check your account settings
        </Link>{" "}
        straight away.
      </P>
    </BrandEmail>
  );
}

export default EmailUpdated;
