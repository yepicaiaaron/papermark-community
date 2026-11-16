/**
 * Denied-access alerts are not part of the community edition. Kept as a
 * no-op so the view routes can call it unconditionally.
 */
export async function reportDeniedAccessAttempt(..._args: unknown[]) {
  return;
}
