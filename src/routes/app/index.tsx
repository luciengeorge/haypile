import { createFileRoute } from "@tanstack/react-router";

import { BookmarkSearch } from "@/components/app/bookmark-search";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = Route.useRouteContext();
  const firstName = session?.user.name?.split(" ")[0];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
          Search everything{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground">Ask in plain language, Haypile digs through everything you've saved.</p>
      </header>
      <BookmarkSearch />
    </div>
  );
}
