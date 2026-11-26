import HundredViewsCongratsEmail from "@/components/emails/hundred-views-congrats";

import { sendEmail } from "@/lib/resend";

import { CreateUserEmailProps } from "../types";

export const sendHundredViewsCongratsEmail = async (params: CreateUserEmailProps) => {
  const { name, email } = params.user;
  const emailTemplate = HundredViewsCongratsEmail({ name });
  try {
    await sendEmail({
      // Upstream product email: not sent by the community edition.
      marketing: true,
      to: email as string,
      subject: `100 views on Papermark. Awesome, ${name}`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};