import { createFileRoute } from "@tanstack/react-router";

import { BookmarkSearch } from "@/components/app/bookmark-search";
import { ConnectSources } from "@/components/app/connect-sources";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = Route.useRouteContext();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">
        Search everything{session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
      </h1>
      <BookmarkSearch />
      <ConnectSources />
    </div>
  );
}
