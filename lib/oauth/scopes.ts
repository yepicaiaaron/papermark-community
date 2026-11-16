/**
 * API token scopes. Upstream Papermark imports this file but does not
 * publish it; this is an independent implementation for the community
 * edition, matching the scope names stored on RestrictedToken.scopes.
 */
export const PRESET_SCOPES = ["apis.all", "apis.read"] as const;

export const GRANULAR_SCOPES = [
  "documents.read",
  "documents.write",
  "links.read",
  "links.write",
  "datarooms.read",
  "datarooms.write",
  "analytics.read",
  "visitors.read",
] as const;

export type PresetScope = (typeof PRESET_SCOPES)[number];
export type GranularScope = (typeof GRANULAR_SCOPES)[number];
export type Scope = PresetScope | GranularScope;
