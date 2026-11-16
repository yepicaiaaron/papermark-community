import { task } from "@trigger.dev/sdk";

/** AI indexing is not part of the community edition. */
export const SUPPORTED_AI_CONTENT_TYPES: string[] = [];

export const processDocumentForAITask = task({
  id: "process-document-for-ai",
  run: async (_payload: any) => ({ skipped: true }),
});

export const addFileToVectorStoreTask = task({
  id: "add-file-to-vector-store",
  run: async (_payload: any) => ({ skipped: true }),
});
