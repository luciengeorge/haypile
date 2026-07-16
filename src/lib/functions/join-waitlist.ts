import { createServerFn } from "@tanstack/react-start";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

import { api } from "@/../convex/_generated/api";

const InputSchema = z.object({
  email: z.string(),
  source: z.string().optional(),
});

// The public waitlist submit runs server-side via ConvexHttpClient, NOT the browser Convex client.
// That client is created with `expectAuth: true`, so on a logged-out page it queues every call
// until an auth token arrives — which never happens for anonymous visitors, so the submit hangs
// forever. Going through the server sidesteps the auth gate entirely. The `joinWaitlist` mutation
// still does the real work (validate + normalize + dedupe by email + rate-limit).
export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }) => {
    const url = import.meta.env.VITE_CONVEX_URL;
    if (!url) throw new Error("Waitlist is temporarily unavailable. Please try again later.");

    const client = new ConvexHttpClient(url);
    return await client.mutation(api.waitlist.joinWaitlist, { email: data.email, source: data.source });
  });
