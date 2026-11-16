import { task } from "@trigger.dev/sdk";

/** Not part of the community edition: these tasks do nothing. */
export const sendPauseResumeNotificationTask = task({
  id: "send-pause-resume-notification",
  run: async (_payload: any) => ({ skipped: true }),
});
