import { tenant } from "@teamhanko/passkeys-next-auth-provider";

/**
 * Passkey sign-in through Hanko. Optional in the community edition: without
 * HANKO_API_KEY and NEXT_PUBLIC_HANKO_TENANT_ID the passkey provider is not
 * registered and passkey routes report that passkeys are off.
 */
export const isPasskeyEnabled = Boolean(
  process.env.HANKO_API_KEY && process.env.NEXT_PUBLIC_HANKO_TENANT_ID,
);

const hanko = tenant({
  apiKey: process.env.HANKO_API_KEY ?? "disabled",
  tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID ?? "disabled",
});

export default hanko;
