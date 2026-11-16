import { task } from "@trigger.dev/sdk";

/** Not part of the community edition: these tasks do nothing. */
export const sendDataroomTrialInfoEmailTask = task({
  id: "send-dataroom-trial-info-email",
  run: async (_payload: any) => ({ skipped: true }),
});

export const sendDataroomTrial24hReminderEmailTask = task({
  id: "send-dataroom-trial-24h-reminder",
  run: async (_payload: any) => ({ skipped: true }),
});

export const sendDataroomTrialExpiredEmailTask = task({
  id: "send-dataroom-trial-expired",
  run: async (_payload: any) => ({ skipped: true }),
});
