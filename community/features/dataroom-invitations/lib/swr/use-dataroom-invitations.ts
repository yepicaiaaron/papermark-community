/** Invitations are not part of the community edition. */
export function useUninvitedMembers(_dataroomId?: string, _groupId?: string) {
  return {
    uninvitedCount: 0,
    uninvitedEmails: [] as string[],
    mutate: async () => undefined,
    loading: false,
  };
}
