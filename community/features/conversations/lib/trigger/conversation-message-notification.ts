import { task } from "@trigger.dev/sdk";

/** Not part of the community edition: these tasks do nothing. */
export const sendConversationMessageNotificationTask = task({
  id: "send-conversation-message-notification",
  run: async (_payload: any) => ({ skipped: true }),
});

export const sendConversationMentionNotificationTask = task({
  id: "send-conversation-mention-notification",
  run: async (_payload: any) => ({ skipped: true }),
});

export const sendConversationTeamMemberNotificationTask = task({
  id: "send-conversation-team-member-notification",
  run: async (_payload: any) => ({ skipped: true }),
});
