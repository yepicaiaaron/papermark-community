import {
  resolveBrandLogo,
  type ResolvedBrandLogo,
} from "@/community/features/branding/lib/brand-logo";
import { resolveBaseBrand } from "@/community/features/branding/lib/resolve-base-brand";

import { getCustomEmail } from "@/lib/edge-config/custom-email";
import { readCachedBrandLogo } from "@/lib/redis/brand-logo-cache";
import { sendEmail } from "@/lib/resend";

import OtpEmailVerification from "@/components/emails/otp-verification";

export type OtpBrandContext = {
  linkBrandId?: string | null;
  dataroomBrandId?: string | null;
};

export const sendOtpVerificationEmail = async (
  email: string,
  code: string,
  isDataroom: boolean = false,
  teamId: string,
  brandContext?: OtpBrandContext,
) => {
  let logo: ResolvedBrandLogo | undefined;
  let from: string | undefined;

  const customEmail = await getCustomEmail(teamId);

  if (customEmail && teamId) {
    from = customEmail;
  }

  // Community edition: show the workspace's own logo (Branding settings)
  // whenever it has one, not only when it sends from a custom address.
  if (teamId) try {
    const hasOverride = !!(
      brandContext?.linkBrandId || brandContext?.dataroomBrandId
    );
    if (hasOverride) {
      const brand = await resolveBaseBrand({
        teamId,
        linkBrandId: brandContext?.linkBrandId,
        dataroomBrandId: brandContext?.dataroomBrandId,
        select: { logo: true, hideLogo: true },
      });
      logo = resolveBrandLogo(brand);
    } else {
      logo = await readCachedBrandLogo(teamId);
    }
  } catch (e) {
    console.error("Could not load workspace logo for email", e);
  }

  const emailTemplate = OtpEmailVerification({
    email,
    code,
    isDataroom,
    logo,
  });

  try {
    await sendEmail({
      from,
      to: email,
      subject: `${code} is your verification code`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      verify: true,
    });
  } catch (e) {
    console.error(e);
  }
};
