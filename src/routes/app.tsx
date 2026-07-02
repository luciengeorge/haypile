import type { ReactNode } from "react";

import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { api } from "@/../convex/_generated/api";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { LimitBanner } from "@/components/billing/limit-banner";
import { LockedWall } from "@/components/billing/locked-wall";
import { TrialPill } from "@/components/billing/trial-pill";
import { HaypileLockup } from "@/components/brand/haypile-lockup";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/use-sign-out";
import { getSession } from "@/lib/functions/get-session";
import { redirectWithToast } from "@/lib/functions/redirect-with-toast";
import { getInitials } from "@/lib/initials";
import { isNavActive } from "@/lib/nav";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  head: () =>
    seo({
      title: "Haypile",
      description: "Your searchable pile of everything you've saved.",
      path: "/app",
      noindex: true,
    }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      await redirectWithToast({
        to: "/login",
        toast: { status: "info", description: "Please sign in to continue" },
      });
    }
    return { session };
  },
  component: AppLayout,
});

type NavItem = {
  to: "/app" | "/app/library" | "/app/sources" | "/app/settings";
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/app", label: "Search", icon: <SearchIcon />, exact: true },
  { to: "/app/library", label: "Library", icon: <LibraryIcon /> },
  { to: "/app/sources", label: "Sources", icon: <SourcesIcon /> },
  { to: "/app/settings", label: "Settings", icon: <SettingsIcon /> },
];

function AppLayout() {
  const { session } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const entitlement = useQuery(api.billing.subscriptions.myEntitlement);
  if (!session) return null;

  // Gate: no active/trialing/past_due/comped subscription → no app. Never-subscribed
  // users pick a plan; lapsed users see the reactivation wall (their data is held 30 days).
  if (!entitlement) return <AppLoading />;
  if (!entitlement.hasAccess) {
    return entitlement.status === "none" ? (
      <Navigate to="/plans" replace />
    ) : (
      <LockedWall purgeAt={entitlement.purgeAt} />
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-3">
          <Link to="/app" className="px-1 py-0.5">
            <HaypileLockup size={26} />
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <NavMenu pathname={pathname} />
        </SidebarContent>
        <SidebarFooter className="gap-2">
          <TrialPill status={entitlement.status} trialEndsAt={entitlement.trialEndsAt} />
          <AccountMenu name={session.user.name} email={session.user.email} image={session.user.image} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <ImpersonationBanner />
        <header className="flex h-14 items-center gap-2 border-b px-4 lg:hidden">
          <SidebarTrigger aria-label="Open navigation" />
          <Link to="/app">
            <HaypileLockup size={22} />
          </Link>
        </header>
        <main className="flex-1 px-4 pt-8 pb-24 lg:px-10 lg:py-10">
          <LimitBanner
            plan={entitlement.plan}
            itemCount={entitlement.itemCount}
            cap={entitlement.cap}
            pct={entitlement.pct}
          />
          <Outlet />
        </main>
        <MobileTabBar pathname={pathname} />
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary motion-reduce:animate-none" />
    </div>
  );
}

// Primary nav on mobile: a bottom tab bar mirroring the sidebar (hidden on lg+, where
// the sidebar takes over). Additive, the sidebar sheet still opens via the top header.
function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 backdrop-blur-sm lg:hidden"
    >
      {NAV.map((item) => {
        const active = isNavActive(item.to, pathname, item.exact);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium [&>svg]:size-5",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavMenu({ pathname }: { pathname: string }) {
  // Close the mobile sheet after navigating; on desktop this is a no-op.
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenu>
      {NAV.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton
            isActive={isNavActive(item.to, pathname, item.exact)}
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
            render={<Link to={item.to} />}
          >
            {item.icon}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function AccountMenu({ name, email, image }: { name?: string | null; email: string; image?: string | null }) {
  const handleSignOut = useSignOut();
  const initials = getInitials(name, email);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={image ?? undefined} alt={name ?? email} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-col text-left leading-tight">
              <span className="truncate text-sm font-medium">{name ?? "Account"}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="text-sm font-medium">{name ?? "Account"}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/app/settings" />}>Settings</DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/app/settings/billing" />}>Billing</DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/app/admin" />}>Admin</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="5" width="16" height="4.5" rx="1.5" />
      <rect x="4" y="11.5" width="16" height="4.5" rx="1.5" />
      <path d="M7 19h10" strokeLinecap="round" />
    </svg>
  );
}

function SourcesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 12a3 3 0 0 1 3-3h3a3 3 0 0 1 0 6h-1.5" strokeLinecap="round" />
      <path d="M15 12a3 3 0 0 1-3 3H9a3 3 0 0 1 0-6h1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
