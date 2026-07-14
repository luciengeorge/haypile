import { createFileRoute } from "@tanstack/react-router";

import { WaitlistPage } from "@/components/waitlist/waitlist-page";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/waitlist")({
  head: () =>
    seo({
      title: "Haypile — join the waitlist",
      description: "Haypile is opening in waves. Join the waitlist and we'll save your spot.",
      path: "/waitlist",
    }),
  component: WaitlistPage,
});
