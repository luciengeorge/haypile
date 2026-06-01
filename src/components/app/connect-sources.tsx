import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

function ago(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function ConnectSources() {
  const status = useQuery(api.sync.state.mySyncStatus);
  const scheduleSource = useMutation(api.sync.state.scheduleSource);
  const [busy, setBusy] = useState(false);

  const x = status?.find((s) => s.source === "x");

  const connect = async () => {
    setBusy(true);
    try {
      await authClient.oauth2.link({ providerId: "x", callbackURL: "/app" });
    } catch (e) {
      toast.error("Couldn't start X connection", { description: e instanceof Error ? e.message : "Unknown error" });
      setBusy(false);
    }
  };

  const syncNow = async () => {
    setBusy(true);
    try {
      await scheduleSource({ source: "x" });
      toast.success("X sync queued — bookmarks will appear shortly");
    } catch (e) {
      toast.error("Couldn't queue sync", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sources</CardTitle>
        <CardDescription>Connect an account to sync and search what you've saved.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">X bookmarks</span>
            <span className="text-xs text-muted-foreground">
              {x
                ? `${x.status}${x.lastSuccessAt ? ` · synced ${ago(x.lastSuccessAt)}` : " · never synced"}`
                : "Not connected"}
              {x?.error ? ` · ${x.error}` : ""}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={connect} disabled={busy}>
              {x ? "Reconnect" : "Connect X"}
            </Button>
            {x ? (
              <Button size="sm" onClick={syncNow} disabled={busy}>
                Sync now
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
