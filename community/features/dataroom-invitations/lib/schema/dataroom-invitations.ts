import { z } from "zod";

export const invitationEmailSchema = z.string().trim().toLowerCase().email();
