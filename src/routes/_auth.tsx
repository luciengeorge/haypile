import { createFileRoute, Outlet } from "@tanstack/react-router";

import { HaypileLockup } from "@/components/brand/haypile-lockup";
import { getSession } from "@/lib/functions/get-session";
import { redirectWithToast } from "@/lib/functions/redirect-with-toast";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_auth")({
  head: () => seo({ title: "Sign in · Haypile", description: "Sign in to Haypile.", path: "/login", noindex: true }),
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      await redirectWithToast({
        to: "/",
        toast: {
          status: "info",
          description: "You are already logged in",
        },
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="grid min-h-svh w-full lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <HaypileLockup tone="reversed" size={32} />
        <div className="flex flex-col gap-5">
          <p className="font-display text-[2.75rem] leading-[1.05] font-semibold tracking-tight">
            Everything you've saved, finally findable.
          </p>
          <p className="max-w-md leading-relaxed text-primary-foreground/70">
            A pika gathers all season into one kept pile, dug back into all winter. Haypile does the same with
            everything you bookmark across the internet — searchable in plain language, the moment you need it.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">© 2026 Haypile</p>
      </aside>

      <main className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <HaypileLockup />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
