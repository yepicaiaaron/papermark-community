/** Freezing data rooms is not part of the community edition. */
export function useFreezeProgress(_args: any) {
  return { isArchiveInProgress: false, progress: 0, progressText: "" };
}
