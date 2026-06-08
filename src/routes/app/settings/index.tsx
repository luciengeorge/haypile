import type { ReactNode } from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/../convex/_generated/api";
import { getPlanLimit, PLANS, type PlanId } from "@/../convex/lib/plans";
import { UsageBar } from "@/components/app/usage-bar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/initials";

export const Route = createFileRoute("/app/settings/")({ component: SettingsPage });

function SettingsPage() {
  const { session } = Route.useRouteContext();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
      <ProfileSection name={session.user.name} email={session.user.email} image={session.user.image} />
      <NotificationsSection />
      <PlanSection />
      <DangerSection />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  );
}

function ProfileSection({ name, email, image }: { name?: string | null; email: string; image?: string | null }) {
  return (
    <Section title="Profile">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar className="size-11">
            <AvatarImage src={image ?? undefined} alt={name ?? email} />
            <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{name ?? "Your account"}</span>
            <span className="truncate text-sm text-muted-foreground">{email}</span>
          </div>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link to="/app/settings/profile" />}>
          Edit
        </Button>
      </div>
    </Section>
  );
}

type PrefKey = "weeklyDigest" | "newFromSources" | "productUpdates";

function NotificationsSection() {
  const prefs = useQuery(api.userPrefs.getMyPrefs);
  const setPref = useMutation(api.userPrefs.setMyPref);
  const onToggle = (key: PrefKey) => (value: boolean) => {
    void setPref({ key, value });
  };

  return (
    <Section title="Notifications">
      <div className="flex flex-col divide-y">
        <ToggleRow
          label="Weekly digest"
          description={`Your "From your Haypile" resurfaced saves, every Monday.`}
          checked={prefs?.weeklyDigest ?? true}
          onChange={onToggle("weeklyDigest")}
        />
        <ToggleRow
          label="New from your sources"
          description="When we finish indexing newly synced saves."
          checked={prefs?.newFromSources ?? true}
          onChange={onToggle("newFromSources")}
        />
        <ToggleRow
          label="Product updates"
          description="Occasional news, tips, and new features."
          checked={prefs?.productUpdates ?? false}
          onChange={onToggle("productUpdates")}
        />
      </div>
    </Section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-pretty text-muted-foreground">{description}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </div>
  );
}

function PlanSection() {
  const sub = useQuery(api.billing.queries.mySubscription);
  const usage = useQuery(api.items.usage);
  const plan: PlanId = sub?.plan ?? "free";
  const meta = PLANS[plan];
  const cap = getPlanLimit(plan, "maxItems") ?? 0;
  const count = usage?.itemCount ?? 0;
  const pct = cap > 0 ? Math.min(100, Math.round((count / cap) * 100)) : 0;

  return (
    <Section title="Plan">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">
            {meta.name}
            {plan === "free" ? "" : ` · £${meta.monthlyPrice}/mo`}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {count.toLocaleString()} of {cap.toLocaleString()} saves indexed
          </span>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link to="/app/settings/billing" />}>
          {plan === "free" ? "Upgrade" : "Manage billing"}
        </Button>
      </div>
      <UsageBar percent={pct} />
    </Section>
  );
}

function DangerSection() {
  const convex = useConvex();
  const navigate = useNavigate();
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const expectedConfirm = "delete my account";
  const canDelete = confirmInput.trim().toLowerCase() === expectedConfirm;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await convex.query(api.users.exportMyData, {});
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `haypile-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Data exported", { description: "Your data has been downloaded." });
    } catch (error) {
      toast.error("Export failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const result = await authClient.deleteUser({ callbackURL: "/" });
      if (result.error) {
        setDeleteError(result.error.message ?? null);
        return;
      }
      toast.success("Confirmation sent", { description: "Check your email to confirm account deletion." });
      navigate({ to: "/" });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Section title="Danger zone">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">Export your data</span>
          <span className="text-sm text-muted-foreground">Download everything you've saved as JSON.</span>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? <Spinner /> : null}
          {isExporting ? "Preparing" : "Export"}
        </Button>
      </div>

      <div className="border-t pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="confirm-delete">Delete account</FieldLabel>
            <FieldDescription>
              Permanently removes your Haypile and all saves. Type{" "}
              <span className="font-medium text-foreground">{expectedConfirm}</span> to confirm — you'll get a final
              email.
            </FieldDescription>
            <Input
              id="confirm-delete"
              value={confirmInput}
              onChange={(event) => setConfirmInput(event.target.value)}
              placeholder={expectedConfirm}
              autoComplete="off"
            />
          </Field>
          <Field>
            <Button onClick={handleDelete} disabled={!canDelete || isDeleting} variant="destructive" className="w-fit">
              {isDeleting ? <Spinner /> : null}
              {isDeleting ? "Sending" : "Delete account"}
            </Button>
            {deleteError ? <FieldError>{deleteError}</FieldError> : null}
          </Field>
        </FieldGroup>
      </div>
    </Section>
  );
}
