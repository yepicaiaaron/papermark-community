/** Teams cannot be paused without billing. */
export function isTeamPaused(_team?: unknown): boolean {
  return false;
}

export async function isTeamPausedById(_teamId: string): Promise<boolean> {
  return false;
}
