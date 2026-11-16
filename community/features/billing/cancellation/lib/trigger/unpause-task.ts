import { task } from "@trigger.dev/sdk";

/** Not part of the community edition: these tasks do nothing. */
export const automaticUnpauseTask = task({
  id: "automatic-unpause",
  run: async (_payload: any) => ({ skipped: true }),
});
