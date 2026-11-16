/** Request lists are not part of the community edition. */
export function useViewerRequestList(_args: any) {
  return {
    enabled: false,
    requestList: null,
    loading: false,
    mutate: async () => undefined,
  };
}
