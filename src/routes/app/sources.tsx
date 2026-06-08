import { createFileRoute } from "@tanstack/react-router";

import { ConnectSources } from "@/components/app/connect-sources";

export const Route = createFileRoute("/app/sources")({ component: SourcesPage });

function SourcesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <ConnectSources />
    </div>
  );
}
