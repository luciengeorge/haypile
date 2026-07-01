import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { formatRelativeTime } from "@/lib/format";
import { SOURCES, type SourceId } from "@/lib/sources";

const SOURCE_HINT: Record<SourceId, string> = {
  x: "your bookmarks",
  github: "your starred repos are waiting",
  youtube: "liked videos & playlists",
  pinterest: "your pins & boards",
  reddit: "your saved posts",
  chrome: "import your browser bookmarks",
};

export function ConnectSources() {
  const status = useQuery(api.sync.state.mySyncStatus);
  const connectedSources = useQuery(api.x.connectedSources);
  const runSourceNow = useMutation(api.sync.state.runSourceNow);
  const [busy, setBusy] = useState(false);

  const x = status?.find((source) => source.source === "x");
  const isConnected = connectedSources?.includes("x") ?? false;
  // Count only our known sources (connectedSources can include non-source OAuth providers).
  const connectedCount = SOURCES.filter((source) => connectedSources?.includes(source.id)).length;

  const connect = async () => {
    setBusy(true);
    try {
      await authClient.oauth2.link({ providerId: "x", callbackURL: "/app/sources" });
    } catch (error) {
      toast.error("Couldn't start X connection", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setBusy(false);
    }
  };

  const syncNow = async () => {
    setBusy(true);
    try {
      await runSourceNow({ source: "x" });
      toast.success("Syncing X bookmarks…");
    } catch (error) {
      toast.error("Couldn't queue sync", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setBusy(false);
    }
  };

  const xMeta = !isConnected
    ? `Not connected · ${SOURCE_HINT.x}`
    : x?.status === "running"
      ? "Syncing…"
      : x?.lastSuccessAt
        ? `Synced ${formatRelativeTime(x.lastSuccessAt)}`
        : "Connected · not synced yet";

  const comingSoon = SOURCES.filter((source) => source.id !== "x");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Sources</h1>
          <p className="text-pretty text-muted-foreground">
            Connect where you save. The more you link, the more Haypile can find.
          </p>
        </div>
        <CoverageMeter connected={connectedCount} total={SOURCES.length} />
      </header>

      <ul className="flex flex-col gap-3">
        <li className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
              <XIcon />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">X</span>
              <span className="truncate text-xs text-muted-foreground">
                {xMeta}
                {x?.error ? ` · ${x.error}` : ""}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {isConnected ? (
              <>
                <span className="hidden items-center gap-1.5 text-sm font-medium text-primary sm:inline-flex">
                  <CheckGlyph />
                  Connected
                </span>
                <Button size="sm" onClick={syncNow} disabled={busy}>
                  Sync now
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={connect} disabled={busy}>
                Connect
              </Button>
            )}
          </div>
        </li>

        {comingSoon.map((source) => (
          <li
            key={source.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-dashed bg-card/40 p-4"
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                {source.label.charAt(0)}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium text-muted-foreground">{source.label}</span>
                <span className="truncate text-xs text-muted-foreground/80">
                  Not connected · {SOURCE_HINT[source.id]}
                </span>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Coming soon
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoverageMeter({ connected, total }: { connected: number; total: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? connected / total : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-12">
        <svg viewBox="0 0 48 48" className="size-12 -rotate-90" aria-hidden="true">
          <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="4" className="stroke-border" />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
          {connected}/{total}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">connected</span>
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4" aria-hidden="true">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
